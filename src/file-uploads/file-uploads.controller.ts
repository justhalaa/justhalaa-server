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
  Res,
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
    @Res() res: Response,
  ) {
    const uploadedFile = await this.fileUploadsService.uploadSingleFile(file);
    console.log(uploadedFile);
    return this.responseService.sendSuccess(
      res,
      uploadedFile,
      'File uploaded successfully',
    );
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
    @Res() res: Response,
  ) {
    const uploadedFiles =
      await this.fileUploadsService.uploadMultipleFiles(files);
    return this.responseService.sendSuccess(
      res,
      uploadedFiles,
      'Files uploaded successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all files' })
  async findAll(@Res() res: Response) {
    const files = await this.fileUploadsService.findAll();
    console.log(files);
    return this.responseService.sendSuccess(
      res,
      files,
      'Files retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.fileUploadsService.findOne(id);
    return this.responseService.sendSuccess(
      res,
      file,
      'File retrieved successfully',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.fileUploadsService.remove(id);
    return this.responseService.sendSuccess(
      res,
      null,
      'File deleted successfully',
    );
  }
}
