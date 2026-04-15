import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  async upload(quoteId: string | undefined, userId: string | undefined, type: string, fileName: string, filePath: string) {
    console.log('📄 Document Upload Debug:');
    console.log(`  Type: ${type}`);
    console.log(`  FileName: ${fileName}`);
    console.log(`  FilePath: ${filePath}`);
    console.log(`  QuoteId: ${quoteId || 'N/A'}`);
    console.log(`  UserId: ${userId || 'N/A'}`);

    if (!userId) {
      throw new Error('userId is required for document upload');
    }

    // CARTE_GRISE is vehicle-specific (linked to quote), other docs are user-specific
    const isVehicleSpecific = type === 'CARTE_GRISE';
    
    if (isVehicleSpecific && !quoteId) {
      throw new Error('quoteId is required for vehicle-specific documents (CARTE_GRISE)');
    }

    // Find existing document
    const existingDoc = await this.prisma.document.findFirst({
      where: isVehicleSpecific ? {
        // Vehicle-specific: unique per quote + type
        quoteId,
        type,
      } : {
        // User-specific: unique per user + type (shared across all quotes)
        userId,
        type,
        quoteId: null, // Only match user-level documents
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
        data: { 
          userId, 
          quoteId: isVehicleSpecific ? quoteId : null, // Link to quote only if vehicle-specific
          type, 
          fileName, 
          filePath 
        },
      });
      console.log(`  ✅ Document CREATED: ID=${document.id}`);
    }

    console.log(`  📦 Final stored document:`);
    console.log(`     ID: ${document.id}`);
    console.log(`     Type: ${document.type}`);
    console.log(`     FileName: ${document.fileName}`);
    console.log(`     FilePath: ${document.filePath}`);
    console.log(`     QuoteId: ${document.quoteId || 'N/A (user-level)'}`);
    console.log('');

    // Notify staff about document upload
    if (quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: quoteId },
        include: { user: true },
      });
      
      if (quote) {
        const staffUsers = await this.prisma.user.findMany({
          where: { role: { in: ['ADMINISTRATEUR_ARS', 'GESTIONNAIRE_VALIDATION_ARS'] } },
        });
        this.notificationsService.notifyDocumentUploaded(
          staffUsers,
          `${quote.user.firstName} ${quote.user.lastName}`,
          quote.quoteNumber,
        ).catch(err => console.error('Failed to send notification:', err.message));
      }
    }

    return document;
  }

  async findByQuote(quoteId: string) {
    // Get the quote to find the userId
    const quote = await this.prisma.quote.findUnique({ 
      where: { id: quoteId },
      select: { userId: true }
    });
    
    if (!quote) {
      return [];
    }
    
    // Return:
    // 1. Documents linked to this specific quote (vehicle-specific like CARTE_GRISE)
    // 2. User-level documents (CIN, PERMIS, etc.) that are shared across all quotes
    return this.prisma.document.findMany({ 
      where: {
        userId: quote.userId,
        OR: [
          { quoteId: quoteId },        // Quote-specific documents
          { quoteId: null },           // User-level documents
        ]
      }
    });
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
    } catch (err: any) {
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
    if (document.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    await this.prisma.document.delete({ where: { id } });
    return { success: true };
  }

  async reject(id: string, reason: string, rejectedBy: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!document) throw new Error('Document not found');
    if (!document.user) throw new Error('User not found for document');

    return { success: true };
  }
}
