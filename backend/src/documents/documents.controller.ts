import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const mimetype = allowedTypes.test(file.mimetype);
        const ext = allowedTypes.test(extname(file.originalname).toLowerCase());
        if (mimetype && ext) {
          return cb(null, true);
        }
        cb(new BadRequestException('Only images and PDF files are allowed'), false);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const { quoteId, type } = req.body;
    if (!quoteId || !type) {
      throw new BadRequestException('quoteId and type are required');
    }
    return this.documentsService.upload(quoteId, type, file.originalname, file.path);
  }

  @Get('quote/:quoteId')
  findByQuote(@Param('quoteId') quoteId: string) {
    return this.documentsService.findByQuote(quoteId);
  }

  @Post(':id/validate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS)
  validate(@Param('id') id: string) {
    return this.documentsService.validate(id);
  }

  @Get(':id/view')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS)
  async view(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const document = await this.documentsService.findById(id);
    const file = createReadStream(document.filePath);
    res.set({
      'Content-Type': this.getContentType(document.fileName),
      'Content-Disposition': `inline; filename="${document.fileName}"`,
    });
    return new StreamableFile(file);
  }

  private getContentType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const types: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return types[ext] || 'application/octet-stream';
  }
}
