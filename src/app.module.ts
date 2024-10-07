import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),  // Use memory storage to keep file buffer
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
