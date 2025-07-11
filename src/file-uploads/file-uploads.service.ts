import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileAttachments } from '../typeORM/entities/file_attachments.entity';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FileUploadsService {
  constructor(
    @InjectRepository(FileAttachments)
    private fileAttachmentsRepository: Repository<FileAttachments>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async uploadSingleFile(file: Express.Multer.File): Promise<FileAttachments> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    console.log(file);
    try {
      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(file);

      // Create file record in database
      const fileAttachment = new FileAttachments();
      fileAttachment.name = file.originalname;
      fileAttachment.url = uploadResult.secure_url;
      fileAttachment.size = file.size;
      fileAttachment.fileType = file.mimetype;

      // Save to database
      return await this.fileAttachmentsRepository.save(fileAttachment);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
  ): Promise<FileAttachments[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      // Upload all files to Cloudinary
      const uploadResults =
        await this.cloudinaryService.uploadMultipleFiles(files);

      // Create file records in database
      const fileAttachments = uploadResults.map((result, index) => {
        const file = files[index];
        const fileAttachment = new FileAttachments();
        fileAttachment.name = file.originalname;
        fileAttachment.url = result.secure_url;
        fileAttachment.size = file.size;
        fileAttachment.fileType = file.mimetype;
        return fileAttachment;
      });

      // Save all to database
      return this.fileAttachmentsRepository.save(fileAttachments);
    } catch (error) {
      throw new BadRequestException(
        `Multiple file upload failed: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<FileAttachments[]> {
    return this.fileAttachmentsRepository.find();
  }

  async findOne(id: number): Promise<FileAttachments> {
    return this.fileAttachmentsRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    const fileAttachment = await this.findOne(id);
    if (!fileAttachment) {
      throw new BadRequestException(`File with ID ${id} not found`);
    }

    // Extract public_id from the URL
    const publicId = fileAttachment.url.split('/').slice(-1)[0].split('.')[0];

    // Delete from Cloudinary
    await this.cloudinaryService.deleteFile(publicId);

    // Delete from database
    await this.fileAttachmentsRepository.delete(id);
  }
}
