import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadsService } from './file-uploads.service';
import { ResponseService } from '../response-service/response-service.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('file-uploads')
@Controller('file-uploads')
export class FileUploadsController {
  constructor(
    private readonly fileUploadsService: FileUploadsService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|pdf|doc|docx)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    res: Response,
  ) {
    try {
      const uploadedFile = await this.fileUploadsService.uploadSingleFile(file);
      return this.responseService.sendSuccess(
        res,
        uploadedFile,
        'File uploaded successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|pdf|doc|docx)$/,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
    res: Response,
  ) {
    try {
      const uploadedFiles =
        await this.fileUploadsService.uploadMultipleFiles(files);
      return this.responseService.sendSuccess(
        res,
        uploadedFiles,
        'Files uploaded successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all files' })
  async findAll(res: Response) {
    try {
      const files = await this.fileUploadsService.findAll();
      return this.responseService.sendSuccess(
        res,
        files,
        'Files retrieved successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, res: Response) {
    try {
      const file = await this.fileUploadsService.findOne(id);
      return this.responseService.sendSuccess(
        res,
        file,
        'File retrieved successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async remove(@Param('id', ParseIntPipe) id: number, res: Response) {
    try {
      await this.fileUploadsService.remove(id);
      return this.responseService.sendSuccess(
        res,
        null,
        'File deleted successfully',
      );
    } catch (error) {
      return this.responseService.sendServerError(
        res,
        'Internal Server Error',
        error,
      );
    }
  }
}
