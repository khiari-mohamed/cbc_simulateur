import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QuoteStatus, DeliveryType } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private notificationsService: NotificationsService,
  ) {}

  async createFromQuote(quoteId: string, createdBy: string, deliveryType?: DeliveryType) {
    const quote = await this.prisma.quote.findUnique({ 
      where: { id: quoteId },
      include: { user: true, contract: true, simulation: true },
    });
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.contract) {
      throw new Error('Contract already exists for this quote');
    }

    if (quote.status !== QuoteStatus.VALIDATED) {
      throw new Error('Quote must be validated before creating contract');
    }

    const contractNumber = await this.generateContractNumber();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    // CDC: Agency pickup is FREE, home delivery has fees
    const deliveryFee = deliveryType === DeliveryType.HOME_DELIVERY ? 10 : 0;

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        quoteId,
        userId: quote.userId,
        startDate,
        endDate,
        createdById: createdBy,
        deliveryType: deliveryType || DeliveryType.AGENCY_PICKUP,
        deliveryFee,
      },
      include: {
        quote: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
          },
        },
        user: true,
      },
    });

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
    });

    // Reject all other quotes from the same simulation
    if (quote.simulationId) {
      await this.prisma.quote.updateMany({
        where: {
          simulationId: quote.simulationId,
          id: { not: quoteId },
          status: { in: [QuoteStatus.GENERATED, QuoteStatus.SUBMITTED, QuoteStatus.VALIDATED] },
        },
        data: {
          status: QuoteStatus.REJECTED,
          rejectionReason: 'Un autre devis de cette simulation a été transformé en contrat.',
        },
      });
    }

    const pdfPath = await this.pdfService.generateContractPdf(contract);
    await this.prisma.contract.update({
      where: { id: contract.id },
      data: { pdfPath },
    });

    // Send notification (non-blocking)
    this.notificationsService.notifyContractCreated(
      quote.user,
      contract.contractNumber,
    ).catch(err => console.error('Failed to send notification:', err.message));

    return { ...contract, pdfPath };
  }

  async createManualContract(
    quoteId: string,
    createdBy: string,
    deliveryType?: DeliveryType,
    contractNumber?: string,
    quittanceNumber?: string,
    files?: Express.Multer.File[],
  ) {
    const quote = await this.prisma.quote.findUnique({ 
      where: { id: quoteId },
      include: { user: true, contract: true, simulation: true },
    });
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.contract) {
      throw new Error('Contract already exists for this quote');
    }

    if (quote.status !== QuoteStatus.VALIDATED) {
      throw new Error('Quote must be validated before creating contract');
    }

    const finalContractNumber = contractNumber || await this.generateContractNumber();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber: finalContractNumber,
        quoteId,
        userId: quote.userId,
        startDate,
        endDate,
        createdById: createdBy,
        deliveryType: deliveryType || DeliveryType.AGENCY_PICKUP,
        deliveryFee: 0,
        quittanceNumber: quittanceNumber || null,
      },
      include: {
        quote: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
          },
        },
        user: true,
      },
    });

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
    });

    // Reject all other quotes from the same simulation
    if (quote.simulationId) {
      await this.prisma.quote.updateMany({
        where: {
          simulationId: quote.simulationId,
          id: { not: quoteId },
          status: { in: [QuoteStatus.GENERATED, QuoteStatus.SUBMITTED, QuoteStatus.VALIDATED] },
        },
        data: {
          status: QuoteStatus.REJECTED,
          rejectionReason: 'Un autre devis de cette simulation a été transformé en contrat.',
        },
      });
    }

    // Store uploaded contract documents
    if (files && files.length > 0) {
      for (const file of files) {
        await this.prisma.document.create({
          data: {
            quoteId,
            userId: quote.userId,
            type: 'CONTRACT_DOCUMENT',
            fileName: file.originalname,
            filePath: file.path,
            isValidated: true,
          },
        });
      }
    }

    const pdfPath = await this.pdfService.generateContractPdf(contract);
    await this.prisma.contract.update({
      where: { id: contract.id },
      data: { pdfPath },
    });

    this.notificationsService.notifyContractCreated(
      quote.user,
      contract.contractNumber,
    ).catch(err => console.error('Failed to send notification:', err.message));

    return { ...contract, pdfPath };
  }

  async findByUser(userId: string) {
    return this.prisma.contract.findMany({
      where: { userId },
      include: { quote: { include: { company: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.contract.findUnique({
      where: { id },
      include: {
        quote: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
          },
        },
        user: true,
      },
    });
  }

  async findByContractNumber(contractNumber: string) {
    return this.prisma.contract.findUnique({
      where: { contractNumber },
      include: {
        quote: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
            simulation: {
              include: {
                vehicle: true,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  private async generateContractNumber(): Promise<string> {
    const count = await this.prisma.contract.count();
    return `C${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
}
