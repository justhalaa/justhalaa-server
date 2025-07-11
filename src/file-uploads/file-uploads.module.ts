import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileAttachments } from '../typeORM/entities/file_attachments.entity';
import { ResponseServiceModule } from '../response-service/response-service.module';
import { FileUploadsController } from './file-uploads.controller';
import { FileUploadsService } from './file-uploads.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileAttachments]), ResponseServiceModule],
  controllers: [FileUploadsController],
  providers: [FileUploadsService, CloudinaryService],
  exports: [FileUploadsService],
})
export class FileUploadsModule {}
