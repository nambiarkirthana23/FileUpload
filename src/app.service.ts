import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly thingsBoardUrl = 'https://cloud.devicedashboard.io';

  async sendDataToCloud(data: any): Promise<any> {
    try {
      // Use backticks for template literals
      const telemetryDataUrl = `${this.thingsBoardUrl}/api/v1/txLdOtprsFfGByhTOv69/telemetry`;
      console.log('Sending data to ThingsBoard:', data);
      
      // Post data to ThingsBoard
      const response = await axios.post(telemetryDataUrl, data);
      console.log('Response from ThingsBoard:', response.data);
      
      // Return the full response object for further inspection if needed
      return response.data;
    } catch (error) {
      console.error('Error sending telemetry data to ThingsBoard:', {
        message: error.message,
        response: error.response ? error.response.data : null,
        config: error.config,
        data: data  // Include the data being sent in the error log
      });

      // Use backticks for template literals in error messages
      throw new Error(`Error sending telemetry data to ThingsBoard: ${error.message}`);
    }
  }
}
