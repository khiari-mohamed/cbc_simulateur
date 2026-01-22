import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private internalNotificationsService: InternalNotificationsService,
  ) {}

  async upload(quoteId: string, type: string, fileName: string, filePath: string) {
    const document = await this.prisma.document.create({
      data: { quoteId, type, fileName, filePath },
      include: {
        quote: {
          include: { user: true },
        },
      },
    });

    // Notify gestionnaires about new document
    this.internalNotificationsService.notifyDocumentUploaded(
      document.quote.quoteNumber,
      `${document.quote.user.firstName} ${document.quote.user.lastName}`,
      type,
    ).catch(err => console.error('Failed to send internal notification:', err.message));

    return document;
  }

  async findByQuote(quoteId: string) {
    return this.prisma.document.findMany({ where: { quoteId } });
  }

  async findById(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');
    return document;
  }

  async validate(id: string) {
    return this.prisma.document.update({
      where: { id },
      data: { isValidated: true },
    });
  }

  async reject(id: string, reason: string, rejectedBy: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        quote: {
          include: { user: true },
        },
      },
    });

    if (!document) throw new Error('Document not found');

    // Internal notification to admin about document rejection
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMINISTRATEUR_ARS', isActive: true },
    });
    
    for (const admin of admins) {
      this.internalNotificationsService.notifyDocumentRejected(
        admin.id,
        document.quote.quoteNumber,
        document.type,
        reason,
      ).catch(err => console.error('Failed to send internal notification:', err.message));
    }

    return { success: true };
  }
}
