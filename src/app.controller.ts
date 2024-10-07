import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';
import { Response } from 'express';
import { AppService } from './app.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface ExcelRow {
  date: string;
  time: string;
  time_?: string;
  [key: string]: any; // To allow other fields
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: MulterFile, @Res() res: Response): Promise<void> {
    console.log('Uploaded file:', file);

    if (!file || !file.buffer) {
      console.error('File object or buffer is missing');
      res.status(400).json({ message: 'No file uploaded or file is empty' });
      return;
    }

    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length === 0) {
        throw new BadRequestException('No sheets found in the Excel file');
      }

      const sheetName = sheetNames[0];
      const sheetData: ExcelRow[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      console.log(`Number of rows read: ${sheetData.length}`);

      const responses = [];
      const errors = [];

      for (const [index, data] of sheetData.entries()) {
        try {
          const dateString = data.date;
          const timeString = data.time;

          console.log('Date:', dateString);
          console.log('Time:', timeString);

          const timestamp = this.convertToEpoch(dateString, timeString);
          console.log('Timestamp:', timestamp);

          const { date, time, time_, ...rest } = data;

          const telemetryData = {
            ts: timestamp,
            values: rest,
          };

          const response = await this.appService.sendDataToCloud(telemetryData);
          console.log(`Response for entry ${index + 1}:`, response);
          responses.push({ index, response });
          console.log(`Successfully processed entry ${index + 1}`);
          
          // Delay to manage load
          await this.delay(1000); // Delay of 1 second
        } catch (err) {
          errors.push({ index, error: err.message });
          console.error(`Failed to process entry ${index + 1}: ${err.message}`);
        }
      }

      console.log(`Processing complete. Success count: ${responses.length}, Failure count: ${errors.length}`);

      res.json({
        message: 'Data processed and sent to cloud',
        successCount: responses.length,
        failureCount: errors.length,
        responses,
        errors,
      });

    } catch (error) {
      console.error(`Failed to process Excel file: ${error.message}`);
      res.status(500).json({ message: `Failed to process Excel file: ${error.message}` });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private convertToEpoch(dateString: string, timeString: string): number {
    if (typeof timeString !== 'string') {
      throw new Error(`Expected timeString to be a string but got ${typeof timeString}`);
    }

    const [hours = 0, minutes = 0, seconds = 0] = timeString.split(/[:.]/).map(Number);
    const [year, month, day] = dateString.split('-').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, seconds, 0);
    return date.getTime();
  }
}
