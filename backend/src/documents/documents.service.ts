import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private internalNotificationsService: InternalNotificationsService,
    private jwtService: JwtService,
  ) {}

  async upload(quoteId: string | undefined, userId: string | undefined, type: string, fileName: string, filePath: string) {
    console.log('📄 Document Upload Debug:');
    console.log(`  Type: ${type}`);
    console.log(`  FileName: ${fileName}`);
    console.log(`  FilePath: ${filePath}`);
    console.log(`  QuoteId: ${quoteId || 'N/A'}`);
    console.log(`  UserId: ${userId || 'N/A'}`);

    // Allow same file for different document types, but replace if same type
    // Check if document of this type already exists for this quote/user
    const existingDoc = await this.prisma.document.findFirst({
      where: {
        ...(quoteId ? { quoteId } : { userId }),
        type,
      },
    });

    let document;
    if (existingDoc) {
      console.log(`  ⚠️  Existing document found for type ${type} - REPLACING`);
      console.log(`     Old: ${existingDoc.fileName}`);
      console.log(`     New: ${fileName}`);
      // Replace existing document of same type
      document = await this.prisma.document.update({
        where: { id: existingDoc.id },
        data: { fileName, filePath, isValidated: false },
      });
      console.log(`  ✅ Document REPLACED: ID=${document.id}`);
    } else {
      console.log(`  ✅ No existing document for type ${type} - CREATING NEW`);
      // Create new document
      document = await this.prisma.document.create({
        data: { quoteId, userId, type, fileName, filePath },
      });
      console.log(`  ✅ Document CREATED: ID=${document.id}`);
    }

    console.log(`  📦 Final stored document:`);
    console.log(`     ID: ${document.id}`);
    console.log(`     Type: ${document.type}`);
    console.log(`     FileName: ${document.fileName}`);
    console.log(`     FilePath: ${document.filePath}`);
    console.log('');

    if (quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: quoteId },
        include: { user: true },
      });
      
      if (quote) {
        this.internalNotificationsService.notifyDocumentUploaded(
          quote.quoteNumber,
          `${quote.user.firstName} ${quote.user.lastName}`,
          type,
        ).catch(err => console.error('Failed to send internal notification:', err.message));
      }
    }

    return document;
  }

  async findByQuote(quoteId: string) {
    return this.prisma.document.findMany({ where: { quoteId } });
  }

  async findByUser(userId: string) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  async findById(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');
    return document;
  }

  async findQuoteById(quoteId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new Error('Quote not found');
    return quote;
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      console.log('Token decoded:', decoded);
      return {
        userId: decoded.sub || decoded.userId,
        role: decoded.role,
      };
    } catch (err) {
      console.error('Token verification error:', err.message);
      throw err;
    }
  }

  async validate(id: string) {
    return this.prisma.document.update({
      where: { id },
      data: { isValidated: true },
    });
  }

  async delete(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');
    
    // Verify user owns this document
    if (document.quoteId) {
      const quote = await this.prisma.quote.findUnique({ where: { id: document.quoteId } });
      if (!quote || quote.userId !== userId) throw new Error('Unauthorized');
    } else if (document.userId && document.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    await this.prisma.document.delete({ where: { id } });
    return { success: true };
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
    if (!document.quote) throw new Error('Quote not found for document');

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
