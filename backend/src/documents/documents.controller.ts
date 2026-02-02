import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException, Res, StreamableFile, Query, UnauthorizedException, Delete } from '@nestjs/common';
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
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('required-types')
  @UseGuards(JwtAuthGuard)
  getRequiredTypes() {
    // Per CDC notes: Add PERMIS, make only CARTE_GRISE and CIN mandatory
    return [
      { type: 'CARTE_GRISE', label: 'Carte grise', required: true },
      { type: 'CIN', label: 'Carte d\'identité (CIN)', required: true },
      { type: 'PERMIS', label: 'Permis de conduire', required: false },
      { type: 'VISITE_TECHNIQUE', label: 'Visite technique', required: false },
      { type: 'VIGNETTE', label: 'Vignette', required: false },
      { type: 'RNE', label: 'Registre du Commerce (RNE)', required: false },
    ];
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
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
    const userId = req.user?.id || req.user?.userId; // Get from authenticated user
    
    console.log('🔍 Upload request user:', req.user);
    console.log('🔍 Extracted userId:', userId);
    
    if (!quoteId || !type) {
      throw new BadRequestException('quoteId and type are required');
    }
    return this.documentsService.upload(quoteId, userId, type, file.originalname, file.path);
  }

  @Get('quote/:quoteId')
  @UseGuards(JwtAuthGuard)
  findByQuote(@Param('quoteId') quoteId: string) {
    return this.documentsService.findByQuote(quoteId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req: any) {
    return this.documentsService.findByUser(req.user.userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUser(@Param('userId') userId: string) {
    return this.documentsService.findByUser(userId);
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS)
  validate(@Param('id') id: string) {
    return this.documentsService.validate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.documentsService.delete(id, req.user?.id || req.user?.userId);
  }

  @Get(':id/view')
  async view(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) {
      throw new UnauthorizedException('Token required');
    }

    let userId: string;
    let userRole: string;
    
    try {
      const decoded = await this.documentsService.verifyToken(token);
      userId = decoded.userId;
      userRole = decoded.role;
    } catch (err) {
      console.error('Token verification failed:', err.message);
      throw new UnauthorizedException('Invalid token');
    }
    
    const document = await this.documentsService.findById(id);
    
    if (document.quoteId) {
      const quote = await this.documentsService.findQuoteById(document.quoteId);
      if (quote.userId !== userId && userRole !== 'ADMINISTRATEUR_ARS' && userRole !== 'GESTIONNAIRE_VALIDATION_ARS') {
        throw new BadRequestException('Unauthorized access to document');
      }
    } else if (document.userId && document.userId !== userId && userRole !== 'ADMINISTRATEUR_ARS') {
      throw new BadRequestException('Unauthorized access to document');
    }
    
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
