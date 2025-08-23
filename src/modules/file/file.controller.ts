import { Controller, Post, UseInterceptors, Body, UploadedFile, UploadedFiles, ParseFilePipe, HttpException, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileValidationPipe } from './filevalidation.pipe';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @UseInterceptors(FileInterceptor('file', {
        dest: 'uploads'
    }))
    @Post('upload')
    uploadFile(@UploadedFile(FileValidationPipe) file: Express.Multer.File, @Body() body: any) {
        console.log(file)
        console.log(body)
    }

    @UseInterceptors(FilesInterceptor('files', 3, {
        dest: 'uploads'
    }))
    @Post('upload-files')
    uploadFiles(@UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>, @Body() body: any) {
        console.log('files', files);
        console.log('body', body);
    }
}
