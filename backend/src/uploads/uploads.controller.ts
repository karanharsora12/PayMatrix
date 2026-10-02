import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import { Public } from '../common/decorators/public.decorator';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Return relative URL or full URL
    return { success: true, url: `/uploads/${file.filename}` };
  }

  @Public()
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(filePath);
  }
}
