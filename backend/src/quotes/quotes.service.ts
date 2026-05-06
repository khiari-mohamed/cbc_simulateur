import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingEngineService } from '../pricing-engine/pricing-engine.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FormulaEligibilityService } from '../formula-eligibility/formula-eligibility.service';
import { QuoteStatus } from '@prisma/client';

import { calculateEffectiveDate } from '../src/common/utils/effective-date.util';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private pricingEngine: PricingEngineService,
    private pdfService: PdfService,
    private notificationsService: NotificationsService,
    private formulaEligibilityService: FormulaEligibilityService,
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

    // ✅ Check age eligibility
    const vehicleAge = this.calculateVehicleAge(simulation.vehicle.firstCirculationDate);
    const eligibility = await this.formulaEligibilityService.checkEligibility(
      companyId,
      simulation.usageId,
      simulation.formulaType,
      vehicleAge,
    );

    if (!eligibility.eligible) {
      throw new Error(
        `La formule ${simulation.formulaType} n'est pas éligible pour ce véhicule: ${eligibility.reason}`,
      );
    }

    // Get ALL active guarantees (both mandatory and optional selected)
    const allGuarantees = await this.prisma.guarantee.findMany({
      where: { isActive: true },
    });

    // Mandatory guarantees (always included)
    const mandatoryGuarantees = allGuarantees.filter(g => !g.isOptional).map(g => g.code);
    
    // Optional guarantees that user selected
    const selectedOptionalGuarantees = simulation.guarantees
      .filter(sg => sg.guarantee.isOptional)
      .map(sg => sg.guarantee.code);
    
    // Combine: ALL mandatory + selected optional
    let allSelectedGuarantees = [...new Set([...mandatoryGuarantees, ...selectedOptionalGuarantees])];

    // ✅ Apply bundling rules dynamically from database
    const bundlings = await this.prisma.guaranteeBundling.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { formulaType: null },
          { formulaType: simulation.formulaType },
        ],
      },
      include: {
        parentGuarantee: true,
        includedGuarantee: true,
      },
    });

    // Group bundlings by parent guarantee
    const bundlingMap = new Map<string, string[]>();
    for (const bundling of bundlings) {
      const parentCode = bundling.parentGuarantee.code;
      if (!bundlingMap.has(parentCode)) {
        bundlingMap.set(parentCode, []);
      }
      bundlingMap.get(parentCode)!.push(bundling.includedGuarantee.code);
    }

    // Apply bundling: if user selected a parent guarantee, include all bundled guarantees
    for (const [parentCode, includedCodes] of bundlingMap.entries()) {
      if (allSelectedGuarantees.includes(parentCode)) {
        for (const includedCode of includedCodes) {
          if (!allSelectedGuarantees.includes(includedCode)) {
            allSelectedGuarantees.push(includedCode);
          }
        }
      }
    }

    // Get DC capital for this specific company from dcCapitals object
    let dcCapitalForCompany = new (require('@prisma/client').Decimal)(0);
    if ((simulation as any).dcCapitals && typeof (simulation as any).dcCapitals === 'object') {
      const dcCapitals = (simulation as any).dcCapitals as Record<string, number>;
      if (dcCapitals[companyId]) {
        dcCapitalForCompany = new (require('@prisma/client').Decimal)(dcCapitals[companyId]);
      }
    } else if (simulation.dcCapital) {
      // Fallback for old single dcCapital field
      dcCapitalForCompany = simulation.dcCapital;
    }

    // Get AC capital for this specific company from acCapitals object
    let acCapitalForCompany = new (require('@prisma/client').Decimal)(0);
    if ((simulation as any).acCapitals && typeof (simulation as any).acCapitals === 'object') {
      const acCapitals = (simulation as any).acCapitals as Record<string, number>;
      if (acCapitals[companyId]) {
        acCapitalForCompany = new (require('@prisma/client').Decimal)(acCapitals[companyId]);
      }
    }

    const pricing = await this.pricingEngine.calculatePremium(
      companyId,
      simulation.vehicle,
      {
        bonusMalus: simulation.bonusMalus,
        usageId: simulation.usageId,
        formulaType: simulation.formulaType,
        selectedGuarantees: allSelectedGuarantees,
        selectedCapitals: {
          BG: simulation.bgLimit ? new (require('@prisma/client').Decimal)(simulation.bgLimit) : new (require('@prisma/client').Decimal)(0),
          DOMMAGES_COLLISIONS: dcCapitalForCompany,
          ASSURANCE_CONDUCTEUR: acCapitalForCompany,
          PERSONNES_TRANSPORTEES: new (require('@prisma/client').Decimal)(5000), // Default PTA capital
        },
        franchiseRate: simulation.franchiseRate ? Number(simulation.franchiseRate) : 0,
        fractionnement: (simulation as any).fractionnement ?? 'ANNUEL',
      },
      simulation.conventionId || undefined,
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
        fractionnement: (simulation as any).fractionnement ?? 'ANNUEL',
        pricingSnapshot: pricing as any,
        eligibilitySnapshot: {
          vehicleAge,
          maxAgeYears: eligibility.maxAge,
          ruleApplied: eligibility.maxAge !== undefined,
        },
        items: {
          create: pricing.items.map(({ guaranteeId, capital, prime, isNotCovered }) => ({
            guaranteeId,
            capital,
            prime,
            isNotCovered: isNotCovered || false,
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
        simulation: { 
          include: { 
            vehicle: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } }
          } 
        },
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        items: { include: { guarantee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any, updatedBy: string) {
    const updateData: any = {
      ...data,
      validatedById: updatedBy,
      validatedAt: new Date(),
    };
    
    // Handle effectiveDate if provided
    if (data.effectiveDate) {
      updateData.effectiveDate = new Date(data.effectiveDate);
    }
    
    const quote = await this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });

    // Send notification email when quote is validated
    if (data.status === QuoteStatus.VALIDATED) {
      this.notificationsService.notifyQuoteValidated(
        quote.user,
        quote.quoteNumber,
      ).catch(err => console.error('Failed to send validation notification:', err.message));
    }

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
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });
  }

  async submit(id: string, userId: string, effectiveDate?: Date) {
    const quote = await this.prisma.quote.findUnique({ 
      where: { id },
      include: { 
        user: true,
        simulation: { include: { vehicle: true } }
      },
    });
    if (!quote || quote.userId !== userId) {
      throw new Error('Quote not found or access denied');
    }

    // CDC: Documents are mandatory before submission - check user's documents (not quote-specific)
    const userDocs = await this.prisma.document.findMany({ where: { userId } });
    const requiredDocs = ['CARTE_GRISE', 'CIN'];
    const uploadedDocTypes = userDocs.map(d => d.type);
    const missingDocs = requiredDocs.filter(type => !uploadedDocTypes.includes(type));
    
    if (missingDocs.length > 0) {
      throw new Error(`Documents manquants: ${missingDocs.join(', ')}. Veuillez télécharger tous les documents requis avant de soumettre.`);
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { 
        status: QuoteStatus.SUBMITTED,
        effectiveDate: effectiveDate
      },
      include: { user: true },
    });

    // Notify client (non-blocking)
    this.notificationsService.notifyQuoteSubmitted(
      updated.user,
      updated.quoteNumber,
    ).catch(err => console.error('Failed to notify client:', err.message));

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

    return quote;
  }

  async updateWithNote(id: string, data: any, note: string, validatedBy: string) {
    const quote = await this.prisma.quote.findUnique({ 
      where: { id },
      include: { user: true, simulation: { include: { vehicle: true } } },
    });
    
    if (!quote) {
      throw new Error('Quote not found');
    }

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

    // Notify client about modification
    try {
      await this.notificationsService.notifyQuoteModified(
        updated.user,
        updated.quoteNumber,
        note,
      );
      console.log('✅ Notification sent to client:', updated.user.email);
    } catch (err: any) {
      console.error('❌ Failed to send notification:', err?.message || 'Unknown error');
      console.error('Full error:', err);
    }

    return updated;
  }

  async modifyQuote(id: string, modifications: any, note: string, modifiedBy: string) {
    const quote = await this.prisma.quote.findUnique({ 
      where: { id },
      include: { user: true, simulation: { include: { vehicle: true } } },
    });
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Recalculate if pricing data changed
    if (modifications.pricingData) {
      const updated = await this.prisma.quote.update({
        where: { id },
        data: {
          primeNette: modifications.pricingData.primeNette,
          frais: modifications.pricingData.frais,
          taxes: modifications.pricingData.taxes,
          totalAPayer: modifications.pricingData.totalAPayer,
          modificationNote: note,
          validatedById: modifiedBy,
          validatedAt: new Date(),
        },
        include: { user: true },
      });

      this.notificationsService.notifyQuoteModified(
        updated.user,
        updated.quoteNumber,
        note,
      ).catch(err => console.error('Failed to send notification:', err.message));

      return updated;
    }

    return this.updateWithNote(id, modifications, note, modifiedBy);
  }

  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `Q${year}${timestamp}${random}`;
  }

  private calculateVehicleAge(firstCirculationDate: Date): number {
    const now = new Date();
    const birthDate = new Date(firstCirculationDate);
    let age = now.getFullYear() - birthDate.getFullYear();
    const hasNotReachedBirthday = now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (hasNotReachedBirthday) age--;
    return age;
  }
}
