import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingEngineService } from '../pricing-engine/pricing-engine.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private pricingEngine: PricingEngineService,
    private pdfService: PdfService,
    private notificationsService: NotificationsService,
    private internalNotificationsService: InternalNotificationsService,
  ) {}

  async generate(simulationId: string, companyId: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { 
        vehicle: true, 
        guarantees: { include: { guarantee: true } },
      },
    });

    if (!simulation) {
      throw new Error('Simulation not found');
    }

    const pricing = await this.pricingEngine.calculatePremium(
      companyId,
      simulation.vehicle,
      {
        bonusMalus: simulation.bonusMalus,
        usage: simulation.usage,
        formulaType: simulation.formulaType,
        selectedGuarantees: simulation.guarantees.map(g => g.guarantee.code),
      },
    );

    const quoteNumber = await this.generateQuoteNumber();

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        simulationId,
        userId: simulation.userId,
        companyId,
        status: QuoteStatus.GENERATED,
        primeNette: pricing.primeNette,
        frais: pricing.frais,
        taxes: pricing.taxes,
        fpac: pricing.fpac,
        fssr: pricing.fssr,
        fg: pricing.fg,
        totalAPayer: pricing.totalAPayer,
        pricingSnapshot: pricing as any,
        items: {
          create: pricing.items.map(({ guaranteeId, capital, prime }) => ({
            guaranteeId,
            capital,
            prime,
          })),
        },
      },
      include: {
        items: { include: { guarantee: true } },
        company: true,
        user: true,
        simulation: { include: { vehicle: true } },
      },
    });

    const pdfPath = await this.pdfService.generateQuotePdf(quote);
    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { pdfPath },
    });

    // Send notification without blocking
    this.notificationsService.notifyQuoteCreated(
      quote.user,
      quote.quoteNumber,
    ).catch(err => console.error('Failed to send notification:', err.message));

    return { ...quote, pdfPath };
  }

  async findForValidation() {
    return this.prisma.quote.findMany({
      where: {
        status: {
          in: [QuoteStatus.SUBMITTED, QuoteStatus.VALIDATED],
        },
      },
      include: {
        company: true,
        simulation: { include: { vehicle: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: { include: { guarantee: true } },
        validatedBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingValidation() {
    return this.prisma.quote.findMany({
      where: { status: QuoteStatus.SUBMITTED },
      include: {
        company: true,
        simulation: { include: { vehicle: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: { include: { guarantee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any, updatedBy: string) {
    const quote = await this.prisma.quote.update({
      where: { id },
      data: {
        ...data,
        validatedById: updatedBy,
        validatedAt: new Date(),
      },
      include: { user: true },
    });
    return quote;
  }

  async findByUser(userId: string) {
    return this.prisma.quote.findMany({
      where: { userId },
      include: {
        company: true,
        simulation: { include: { vehicle: true } },
        items: { include: { guarantee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.quote.findMany({
      include: {
        company: true,
        simulation: { include: { vehicle: true } },
        items: { include: { guarantee: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        validatedBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: { include: { guarantee: true } },
        company: true,
        simulation: { include: { vehicle: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async submit(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote || quote.userId !== userId) {
      throw new Error('Quote not found or access denied');
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.SUBMITTED },
      include: { user: true },
    });

    // Notify client (non-blocking)
    this.notificationsService.notifyQuoteSubmitted(
      updated.user,
      updated.quoteNumber,
    ).catch(err => console.error('Failed to notify client:', err.message));

    // Internal notification to gestionnaires
    this.internalNotificationsService.notifyQuoteSubmitted(
      updated.id,
      `${updated.user.firstName} ${updated.user.lastName}`,
      updated.quoteNumber,
    ).catch(err => console.error('Failed to send internal notification:', err.message));

    // Notify gestionnaires AND admins (non-blocking)
    this.prisma.user.findMany({
      where: { 
        role: { 
          in: ['ADMINISTRATEUR_ARS', 'GESTIONNAIRE_VALIDATION_ARS'] 
        } 
      },
    }).then(staffUsers => {
      this.notificationsService.notifyAdminNewQuote(
        staffUsers,
        `${updated.user.firstName} ${updated.user.lastName}`,
        updated.quoteNumber,
      ).catch(err => console.error('Failed to notify staff:', err.message));
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ars.com';
    this.notificationsService.sendQuoteSubmitted(
      adminEmail,
      updated.quoteNumber,
      `${updated.user.firstName} ${updated.user.lastName}`,
    ).catch(err => console.error('Failed to send email:', err.message));

    return updated;
  }

  async validate(id: string, validatedBy: string) {
    const validator = await this.prisma.user.findUnique({ where: { id: validatedBy } });
    const quote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.VALIDATED,
        validatedById: validatedBy,
        validatedAt: new Date(),
      },
      include: { user: true },
    });

    this.notificationsService.notifyQuoteValidated(
      quote.user,
      quote.quoteNumber,
    ).catch(err => console.error('Failed to send notification:', err.message));

    // Internal notification to admin about validation
    if (validator?.role === 'GESTIONNAIRE_VALIDATION_ARS') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMINISTRATEUR_ARS', isActive: true },
      });
      
      for (const admin of admins) {
        this.internalNotificationsService.notifyQuoteValidated(
          admin.id,
          quote.quoteNumber,
          `${validator.firstName} ${validator.lastName}`,
        ).catch(err => console.error('Failed to send internal notification:', err.message));
      }
    }

    return quote;
  }

  async reject(id: string, reason?: string, rejectedBy?: string) {
    const rejector = rejectedBy ? await this.prisma.user.findUnique({ where: { id: rejectedBy } }) : null;
    const quote = await this.prisma.quote.update({
      where: { id },
      data: { 
        status: QuoteStatus.REJECTED,
        rejectionReason: reason,
        validatedById: rejectedBy,
        validatedAt: new Date(),
      },
      include: { user: true },
    });

    this.notificationsService.notifyQuoteRejected(
      quote.user,
      quote.quoteNumber,
      reason,
    ).catch(err => console.error('Failed to send notification:', err.message));

    // Internal notification to admin about rejection
    if (rejector?.role === 'GESTIONNAIRE_VALIDATION_ARS') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMINISTRATEUR_ARS', isActive: true },
      });
      
      for (const admin of admins) {
        this.internalNotificationsService.notifyQuoteRejected(
          admin.id,
          quote.quoteNumber,
          `${rejector.firstName} ${rejector.lastName}`,
          reason || 'Aucune raison spécifiée',
        ).catch(err => console.error('Failed to send internal notification:', err.message));
      }
    }

    return quote;
  }

  async updateWithNote(id: string, data: any, note: string, validatedBy: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    // If quote is already SUBMITTED, it means gestionnaire is validating with note
    // The note should be sent as modification
    const isFirstValidation = quote.status === QuoteStatus.SUBMITTED;
    
    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        ...data,
        modificationNote: note,
        status: QuoteStatus.VALIDATED,
        validatedById: validatedBy,
        validatedAt: new Date(),
      },
      include: { user: true },
    });

    // Notify based on whether it's first validation or modification
    if (isFirstValidation) {
      // First validation with note - treat as modification
      this.notificationsService.notifyQuoteModified(
        updated.user,
        updated.quoteNumber,
        note,
      ).catch(err => console.error('Failed to send notification:', err.message));
    } else {
      // Simple validation
      this.notificationsService.notifyQuoteValidated(
        updated.user,
        updated.quoteNumber,
      ).catch(err => console.error('Failed to send notification:', err.message));
    }

    return updated;
  }

  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `Q${year}${timestamp}${random}`;
  }
}
