import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormulaType, UsageType, ReductionMetric } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ReductionRatesService } from './reduction-rates.service';

interface VehicleData {
  fiscalHorsepower: number;
  numberOfSeats: number;
  newValue: Decimal;
  marketValue: Decimal;
  firstCirculationDate: Date;
}

interface SimulationData {
  bonusMalus: Decimal;
  usage: UsageType;
  formulaType: FormulaType;
  selectedGuarantees: string[];
  selectedCapitals?: Record<string, Decimal>;
  franchiseRate?: number;
}

interface PricingResult {
  primeNette: Decimal;
  frais: Decimal;
  taxes: Decimal;
  fpac: Decimal;
  fssr: Decimal;
  fg: Decimal;
  totalAPayer: Decimal;
  items: Array<{
    guaranteeCode: string;
    guaranteeId: string;
    capital: Decimal;
    prime: Decimal;
  }>;
  breakdown: {
    primeRC: Decimal;
    taxesDetail: {
      taxe12Percent: Decimal;
      taxe2Percent: Decimal;
    };
  };
}

@Injectable()
export class PricingEngineService {
  constructor(
    private prisma: PrismaService,
    private reductionRatesService: ReductionRatesService,
  ) {}

  async calculatePremium(
    companyId: string,
    vehicle: VehicleData,
    simulation: SimulationData,
    conventionId?: string,
  ): Promise<PricingResult> {
    console.log('🔍 Calculating premium for company:', companyId);
    console.log('📋 Selected guarantees:', simulation.selectedGuarantees);
    console.log('🚗 Vehicle:', { newValue: vehicle.newValue, marketValue: vehicle.marketValue, fiscalHorsepower: vehicle.fiscalHorsepower });
    
    this.validateMandatoryInputs(vehicle, simulation);
    const vehicleAge = this.calculateVehicleAge(vehicle.firstCirculationDate);

    // CDC Business Rules Validation
    this.validateBusinessRules(simulation.formulaType, vehicleAge, simulation.selectedGuarantees);

    const items: Array<{
      guaranteeCode: string;
      guaranteeId: string;
      capital: Decimal;
      prime: Decimal;
    }> = [];

    let primeNette = new Decimal(0);
    let primeRC = new Decimal(0);

    // 1. RC (MANDATORY - Always included)
    const rcResult = await this.calculateRC(companyId, vehicle, simulation, conventionId);
    if (rcResult) {
      console.log('✅ RC calculated:', rcResult.prime.toString());
      items.push(rcResult);
      primeNette = primeNette.add(rcResult.prime);
      primeRC = rcResult.prime;
    } else {
      console.log('❌ RC NOT calculated - no pricing rule found');
    }

    // 2. CAS (MANDATORY - Always included)
    const casResult = await this.calculateCAS(companyId, conventionId);
    if (casResult) {
      console.log('✅ CAS calculated:', casResult.prime.toString());
      items.push(casResult);
      primeNette = primeNette.add(casResult.prime);
    } else {
      console.log('❌ CAS NOT calculated - no pricing rule found');
    }

    // 3. VOL (MANDATORY - Always included)
    const volResult = await this.calculateVOL(companyId, vehicle, conventionId);
    if (volResult) {
      console.log('✅ VOL calculated:', volResult.prime.toString());
      items.push(volResult);
      primeNette = primeNette.add(volResult.prime);
    } else {
      console.log('❌ VOL NOT calculated - no pricing rule found');
    }

    // 4. INCENDIE (MANDATORY - Always included)
    const incendieResult = await this.calculateINCENDIE(companyId, vehicle, conventionId);
    if (incendieResult) {
      console.log('✅ INCENDIE calculated:', incendieResult.prime.toString());
      items.push(incendieResult);
      primeNette = primeNette.add(incendieResult.prime);
    } else {
      console.log('❌ INCENDIE NOT calculated - no pricing rule found');
    }

    // 5. PERSONNES_TRANSPORTEES (MANDATORY - Always included)
    const selectedCapital = simulation.selectedCapitals?.['PERSONNES_TRANSPORTEES'];
    const ptResult = await this.calculatePERSONNES_TRANSPORTEES(companyId, selectedCapital, conventionId);
    if (ptResult) {
      console.log('✅ PTA calculated:', ptResult.prime.toString());
      items.push(ptResult);
      primeNette = primeNette.add(ptResult.prime);
    } else {
      console.log('❌ PTA NOT calculated - no pricing rule found');
    }

    // 6. ASSISTANCE (MANDATORY - Always included)
    const assistanceResult = await this.calculateASSISTANCE(companyId, conventionId);
    if (assistanceResult) {
      console.log('✅ ASSISTANCE calculated:', assistanceResult.prime.toString());
      items.push(assistanceResult);
      primeNette = primeNette.add(assistanceResult.prime);
    } else {
      console.log('❌ ASSISTANCE NOT calculated - no pricing rule found');
    }

    // 7. TOUS_RISQUES_0 (Only if formula is TOUS_RISQUES_0)
    if (simulation.formulaType === FormulaType.TOUS_RISQUES_0) {
      const franchiseRate = simulation.franchiseRate ?? 0;
      const trResult = await this.calculateTOUS_RISQUES_0(companyId, vehicle, vehicleAge, simulation, franchiseRate, conventionId);
      if (trResult) {
        console.log('✅ TOUS_RISQUES_0 calculated:', trResult.prime.toString());
        items.push(trResult);
        primeNette = primeNette.add(trResult.prime);
      } else {
        console.log('❌ TOUS_RISQUES_0 NOT calculated - no pricing rule found');
      }
    }

    // 8. DOMMAGES_COLLISIONS (Only if formula is DOMMAGES_COLLISIONS and vehicle < 10 years)
    if (simulation.formulaType === FormulaType.DOMMAGES_COLLISIONS) {
      const selectedCapital = simulation.selectedCapitals?.['DOMMAGES_COLLISIONS'];
      const dcResult = await this.calculateDOMMAGES_COLLISIONS(companyId, vehicle, vehicleAge, simulation, selectedCapital, conventionId);
      if (dcResult) {
        items.push(dcResult);
        primeNette = primeNette.add(dcResult.prime);
      }
    }

    // 9. BG (Bris de Glaces) - FREE if TOUS_RISQUES_0, otherwise Capital * 0.08
    if (simulation.selectedGuarantees.includes('BG') || simulation.formulaType === FormulaType.TOUS_RISQUES_0) {
      const selectedCapital = simulation.selectedCapitals?.['BG'];
      const bgResult = await this.calculateBG(
        companyId,
        vehicle,
        simulation.formulaType === FormulaType.TOUS_RISQUES_0,
        selectedCapital,
        conventionId,
      );
      if (bgResult) {
        items.push(bgResult);
        primeNette = primeNette.add(bgResult.prime);
      }
    }

    // 10. INCENDIE_EMEUTES (Optional)
    if (simulation.selectedGuarantees.includes('INCENDIE_EMEUTES')) {
      const incendieEmeutesResult = await this.calculateINCENDIE_EMEUTES(companyId, vehicle, conventionId);
      if (incendieEmeutesResult) {
        console.log('✅ INCENDIE_EMEUTES calculated:', incendieEmeutesResult.prime.toString());
        items.push(incendieEmeutesResult);
        primeNette = primeNette.add(incendieEmeutesResult.prime);
      } else {
        console.log('❌ INCENDIE_EMEUTES NOT calculated - no pricing rule found');
      }
    }

    // 11. CATASTROPHES_NATURELLES (Optional - AMANA only for Tous Risques)
    if (simulation.selectedGuarantees.includes('CATASTROPHES_NATURELLES')) {
      const catnatResult = await this.calculateCATNAT(companyId, vehicle, simulation.formulaType, conventionId);
      if (catnatResult) {
        console.log('✅ CATASTROPHES_NATURELLES calculated:', catnatResult.prime.toString());
        items.push(catnatResult);
        primeNette = primeNette.add(catnatResult.prime);
      } else {
        console.log('❌ CATASTROPHES_NATURELLES NOT calculated - no pricing rule found or not AMANA');
      }
    }

    // 12. DOMMAGES_EMEUTES (Optional)
    if (simulation.selectedGuarantees.includes('DOMMAGES_EMEUTES')) {
      const dommagesEmeutesResult = await this.calculateDOMMAGES_EMEUTES(companyId, vehicle, conventionId);
      if (dommagesEmeutesResult) {
        console.log('✅ DOMMAGES_EMEUTES calculated:', dommagesEmeutesResult.prime.toString());
        items.push(dommagesEmeutesResult);
        primeNette = primeNette.add(dommagesEmeutesResult.prime);
      } else {
        console.log('❌ DOMMAGES_EMEUTES NOT calculated - no pricing rule found');
      }
    }

    // 13. DEFENSE_RECOURS (Optional - FREE for AMANA with Tous Risques 0%)
    if (simulation.selectedGuarantees.includes('DEFENSE_RECOURS')) {
      const defenseRecoursResult = await this.calculateDEFENSE_RECOURS(companyId, simulation.formulaType, conventionId);
      if (defenseRecoursResult) {
        items.push(defenseRecoursResult);
        primeNette = primeNette.add(defenseRecoursResult.prime);
      }
    }

    // CDC EXACT CALCULATION
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Company not found');
    
    // Get all values from company settings - NO FALLBACKS
    if (company.contractFees === null) throw new BadRequestException('Contract fees not configured');
    if (company.fpac === null) throw new BadRequestException('FPAC not configured');
    if (company.fssr === null) throw new BadRequestException('FSSR not configured');
    if (company.fg === null) throw new BadRequestException('FG not configured');
    
    const frais = new Decimal(company.contractFees);
    const fpac = new Decimal(company.fpac);
    const fssr = new Decimal(company.fssr);
    const fg = new Decimal(company.fg);
    
    const taxe12Percent = primeNette.add(frais).mul(0.12);
    const taxe2Percent = primeRC.add(frais).mul(0.02);
    const taxes = taxe12Percent.add(taxe2Percent);

    const totalAPayer = primeNette.add(frais).add(taxes).add(fpac).add(fssr).add(fg);

    return {
      primeNette,
      frais,
      taxes,
      fpac,
      fssr,
      fg,
      totalAPayer,
      items,
      breakdown: {
        primeRC,
        taxesDetail: {
          taxe12Percent,
          taxe2Percent,
        },
      },
    };
  }

  private validateMandatoryInputs(vehicle: VehicleData, simulation: SimulationData) {
    if (!vehicle.newValue || vehicle.newValue.lte(0)) {
      throw new BadRequestException('valeur_a_neuf is required');
    }
    if (!vehicle.marketValue || vehicle.marketValue.lte(0)) {
      throw new BadRequestException('valeur_venale is required');
    }
    if (!vehicle.fiscalHorsepower || vehicle.fiscalHorsepower <= 0) {
      throw new BadRequestException('cv (puissance fiscale) is required');
    }
    if (!vehicle.numberOfSeats || vehicle.numberOfSeats <= 0) {
      throw new BadRequestException('nb_places is required');
    }
    if (!vehicle.firstCirculationDate) {
      throw new BadRequestException('date_premiere_mise_en_circulation is required');
    }
    if (!simulation.bonusMalus) {
      throw new BadRequestException('classe_bonus_malus is required');
    }
    if (!simulation.formulaType) {
      throw new BadRequestException('formule is required');
    }
  }

  private validateBusinessRules(formulaType: FormulaType, vehicleAge: number, selectedGuarantees: string[]) {
    // Rule 1: DOMMAGES_COLLISIONS and TOUS_RISQUES_0 are mutually exclusive
    if (formulaType === FormulaType.DOMMAGES_COLLISIONS && selectedGuarantees.includes('TOUS_RISQUES_ZERO')) {
      throw new BadRequestException('Dommages Collision cannot be combined with Tous Risques');
    }

    // Rule 2: DOMMAGES_COLLISIONS only for vehicles < 10 years
    if (formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= 10) {
      throw new BadRequestException('Dommages Collision is only available for vehicles less than 10 years old');
    }

    // Rule 3: TOUS_RISQUES_0 only for vehicles < 2 years
    if (formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= 2) {
      throw new BadRequestException('Tous Risques 0% is only available for vehicles less than 2 years old');
    }

    // Rule 4: STANDARD formula excludes TOUS_RISQUES_ZERO and DOMMAGES_COLLISIONS
    if (formulaType === FormulaType.STANDARD) {
      if (selectedGuarantees.includes('TOUS_RISQUES_ZERO') || selectedGuarantees.includes('DOMMAGES_COLLISIONS')) {
        throw new BadRequestException('Standard formula cannot include Tous Risques or Dommages Collision');
      }
    }
  }

  private async calculateRC(companyId: string, vehicle: VehicleData, simulation: SimulationData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'RC' } });
    if (!guarantee) return null;

    const bonusMalusClass = Math.round(simulation.bonusMalus.toNumber());
    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        minPower: { lte: vehicle.fiscalHorsepower },
        maxPower: { gte: vehicle.fiscalHorsepower },
        bonusMalusClass: bonusMalusClass,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          minPower: { lte: vehicle.fiscalHorsepower },
          maxPower: { gte: vehicle.fiscalHorsepower },
          bonusMalusClass: bonusMalusClass,
          conventionId: null,
        },
      });
    }
    
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'RC',
      guaranteeId: guarantee.id,
      capital: new Decimal(0),
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateCAS(companyId: string, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'CAS' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }
    
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'CAS',
      guaranteeId: guarantee.id,
      capital: new Decimal(1000),
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateVOL(companyId: string, vehicle: VehicleData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'VOL' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }

    if (!rule || rule.ratePercentage === null || rule.fixedPremium === null) return null;

    // FORMULA: ((marketValue * ratePercentage) + fixedPremium) * (1 - discountPercent/100)
    let prime = vehicle.marketValue.mul(rule.ratePercentage).add(rule.fixedPremium);
    
    // Apply formula discount (stored as percent: 15 means 15% discount)
    if (rule.reductionRate && rule.reductionRate.gt(0)) {
      const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
      prime = prime.mul(multiplier);
    }

    // Apply convention reduction if exists
    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'VOL',
        conventionId,
        vehicle.marketValue,
        'MARKET_VALUE' as ReductionMetric,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'VOL',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime,
    };
  }

  private async calculateINCENDIE(companyId: string, vehicle: VehicleData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }

    if (!rule || rule.ratePercentage === null || rule.fixedPremium === null) return null;

    // FORMULA: ((marketValue * ratePercentage) + fixedPremium) * (1 - discountPercent/100)
    let prime = vehicle.marketValue.mul(rule.ratePercentage).add(rule.fixedPremium);
    
    // Apply formula discount
    if (rule.reductionRate && rule.reductionRate.gt(0)) {
      const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
      prime = prime.mul(multiplier);
    }

    // Apply convention reduction if exists
    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'INCENDIE',
        conventionId,
        vehicle.marketValue,
        'MARKET_VALUE' as ReductionMetric,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'INCENDIE',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime,
    };
  }

  private async calculatePERSONNES_TRANSPORTEES(companyId: string, selectedCapital?: Decimal, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rules = await this.prisma.pricingRule.findMany({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
      orderBy: { minCapital: 'desc' },
    });

    if (!rules.length && conventionId) {
      rules = await this.prisma.pricingRule.findMany({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
        orderBy: { minCapital: 'desc' },
      });
    }

    if (!rules.length) return null;

    let matchedRule = rules[0];
    if (selectedCapital) {
      for (const rule of rules) {
        if (rule.minCapital && selectedCapital.gte(rule.minCapital)) {
          matchedRule = rule;
          break;
        }
      }
    }

    if (matchedRule.fixedPremium === null || matchedRule.minCapital === null) return null;

    return {
      guaranteeCode: 'PERSONNES_TRANSPORTEES',
      guaranteeId: guarantee.id,
      capital: new Decimal(matchedRule.minCapital),
      prime: new Decimal(matchedRule.fixedPremium),
    };
  }

  private async calculateASSISTANCE(companyId: string, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }
    
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'ASSISTANCE',
      guaranteeId: guarantee.id,
      capital: new Decimal(0),
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateTOUS_RISQUES_0(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, franchiseRate: number, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
    if (!guarantee) {
      console.log('❌ TOUS_RISQUES_ZERO guarantee not found');
      return null;
    }

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        franchiseRate: franchiseRate,
        isActive: true,
        ...conventionScope,
      },
    });

    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          franchiseRate: franchiseRate,
          isActive: true,
          conventionId: null,
        },
      });
    }

    if (!rule || rule.ratePercentage === null || rule.fixedPremium === null) return null;

    // FORMULA: ((newValue * ratePercentage) + fixedPremium) * (1 - discountPercent/100)
    let prime = vehicle.newValue.mul(rule.ratePercentage).add(rule.fixedPremium);
    
    // Apply formula discount
    if (rule.reductionRate && rule.reductionRate.gt(0)) {
      const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
      prime = prime.mul(multiplier);
    }

    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'TOUS_RISQUES_ZERO',
        conventionId,
        vehicle.newValue,
        'NEW_VALUE' as ReductionMetric,
        FormulaType.TOUS_RISQUES_0,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'TOUS_RISQUES_ZERO',
      guaranteeId: guarantee.id,
      capital: vehicle.newValue,
      prime,
    };
  }

  private async calculateDOMMAGES_COLLISIONS(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, selectedCapital?: Decimal, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
    if (!guarantee) return null;

    const vv = vehicle.marketValue;

    // Get DC config for this usage type
    const dcConfig = await this.prisma.dcConfig.findFirst({
      where: { 
        companyId,
        usageType: simulation.usage,
        isActive: true,
      },
    });

    if (!dcConfig) {
      console.log('❌ DC Config not found for company and usage type');
      return null;
    }

    // Validate and enforce capital limits
    const requestedCapital = selectedCapital || dcConfig.minCapital;
    
    // Rule: capital >= minCapital
    if (requestedCapital.lt(dcConfig.minCapital)) {
      throw new BadRequestException(`Capital must be at least ${dcConfig.minCapital} DT`);
    }

    // Rule: capital <= min(maxCapitalPercent * VV, maxCapitalAbsolute)
    const percentCeiling = vv.mul(dcConfig.maxCapitalPercent.div(100));
    const effectiveCeiling = percentCeiling.lt(dcConfig.maxCapitalAbsolute) 
      ? percentCeiling 
      : dcConfig.maxCapitalAbsolute;
    
    if (requestedCapital.gt(effectiveCeiling)) {
      throw new BadRequestException(`Capital cannot exceed ${effectiveCeiling.toFixed(2)} DT`);
    }

    // Validate capital steps
    const isValidStep = await this.validateCapitalStep(companyId, simulation.usage, requestedCapital);
    if (!isValidStep) {
      throw new BadRequestException('Capital does not match allowed increments');
    }

    const capital = requestedCapital;

    if (dcConfig.useMatrix) {
      return await this.calculateDC_Matrix(companyId, guarantee.id, vv, capital, dcConfig, simulation.usage, conventionId);
    } else {
      return await this.calculateDC_Progressive(companyId, guarantee.id, vv, capital, dcConfig, simulation.usage, conventionId);
    }
  }

  private async validateCapitalStep(companyId: string, usageType: UsageType, capital: Decimal): Promise<boolean> {
    const tiers = await this.prisma.dcCapitalTier.findMany({
      where: { companyId, usageType, isActive: true },
      orderBy: { minAmount: 'asc' },
    });

    for (const tier of tiers) {
      if (capital.gte(tier.minAmount) && (!tier.maxAmount || capital.lte(tier.maxAmount))) {
        const offset = capital.sub(tier.minAmount);
        const remainder = offset.mod(tier.step);
        return remainder.eq(0);
      }
    }

    return false;
  }

  private async calculateDC_Matrix(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageType: UsageType, conventionId?: string) {
    // Find matching VV range for this usage type
    const vvRange = await this.prisma.dcMatrixVvRange.findFirst({
      where: {
        companyId,
        usageType,
        minVv: { lte: vv },
        OR: [
          { maxVv: { gte: vv } },
          { maxVv: null },
        ],
        isActive: true,
      },
    });

    if (!vvRange) {
      throw new BadRequestException(`No matrix VV range found for usage ${usageType} and VV ${vv}`);
    }

    // Find matching capital for this usage type
    const capitalEntry = await this.prisma.dcMatrixCapital.findFirst({
      where: {
        companyId,
        usageType,
        amount: capital,
        isActive: true,
      },
    });

    if (!capitalEntry) {
      throw new BadRequestException(`No matrix capital found for usage ${usageType} and capital ${capital}`);
    }

    // Get price from matrix
    const matrixPrice = await this.prisma.dcMatrixPrice.findUnique({
      where: {
        vvRangeId_capitalId: {
          vvRangeId: vvRange.id,
          capitalId: capitalEntry.id,
        },
      },
    });

    if (!matrixPrice) {
      throw new BadRequestException(`No matrix price found for VV range and capital combination`);
    }

    // FORMULA: (matrixPrime + basePremium) * (1 - discountPercent/100)
    let prime = new Decimal(matrixPrice.prime).add(dcConfig.basePremium);

    // Apply formula discount
    if (dcConfig.discountPercent && dcConfig.discountPercent.gt(0)) {
      const multiplier = new Decimal(1).sub(dcConfig.discountPercent.div(100));
      prime = prime.mul(multiplier);
    }

    // Apply convention reduction
    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'DOMMAGES_COLLISIONS',
        conventionId,
        capital,
        'DC_CAPITAL' as ReductionMetric,
        FormulaType.DOMMAGES_COLLISIONS,
        usageType,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'DOMMAGES_COLLISIONS',
      guaranteeId,
      capital,
      prime,
    };
  }

  private async calculateDC_CommercialLegacy(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, conventionId?: string) {
    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId,
        usageType: 'COMMERCIAL',
        minMarketValue: { lte: vv },
        OR: [
          { maxMarketValue: { gte: vv } },
          { maxMarketValue: null }
        ],
        minCapital: capital,
        maxCapital: capital,
        isActive: true,
        ...conventionScope,
      },
      orderBy: [{ minMarketValue: 'desc' }]
    });

    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId,
          usageType: 'COMMERCIAL',
          minMarketValue: { lte: vv },
          OR: [
            { maxMarketValue: { gte: vv } },
            { maxMarketValue: null }
          ],
          minCapital: capital,
          maxCapital: capital,
          isActive: true,
          conventionId: null,
        },
        orderBy: [{ minMarketValue: 'desc' }]
      });
    }

    if (!rule || rule.fixedPremium === null) return null;

    // FORMULA: (fixedPremium + basePremium) * (1 - discountPercent/100)
    let prime = new Decimal(rule.fixedPremium).add(dcConfig.basePremium);

    // Apply formula discount
    if (dcConfig.discountPercent && dcConfig.discountPercent.gt(0)) {
      const multiplier = new Decimal(1).sub(dcConfig.discountPercent.div(100));
      prime = prime.mul(multiplier);
    }

    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'DOMMAGES_COLLISIONS',
        conventionId,
        capital,
        'DC_CAPITAL' as ReductionMetric,
        FormulaType.DOMMAGES_COLLISIONS,
        UsageType.COMMERCIAL,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'DOMMAGES_COLLISIONS',
      guaranteeId,
      capital,
      prime,
    };
  }

  private async calculateDC_Progressive(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageType: UsageType, conventionId?: string) {
    // Get progressive tiers for this usage type
    const tiers = await this.prisma.dcProgressiveTier.findMany({
      where: {
        companyId,
        usageType,
        isActive: true,
      },
      orderBy: { tierNumber: 'asc' },
    });

    if (!tiers.length) return null;

    const capitalPercent = capital.div(vv).mul(100);
    let primeVariable = new Decimal(0);

    // Simple case: <= 10%
    if (capitalPercent.lte(10)) {
      const tier1 = tiers.find(t => t.tierNumber === 1);
      if (!tier1) return null;
      primeVariable = capital.mul(tier1.tierRate);
    } else {
      // Progressive calculation: each tranche = 10% of VV
      let capitalRemaining = capital;
      const trancheSize = vv.mul(0.1); // 10% of VV
      let tierIndex = 0;

      while (capitalRemaining.gt(0)) {
        if (tierIndex >= tiers.length) {
          // No more tiers defined - apply last tier rate to remainder
          const lastTier = tiers[tiers.length - 1];
          primeVariable = primeVariable.add(capitalRemaining.mul(lastTier.tierRate));
          break;
        }

        const tier = tiers[tierIndex];
        const amountInTier = capitalRemaining.gt(trancheSize) ? trancheSize : capitalRemaining;
        primeVariable = primeVariable.add(amountInTier.mul(tier.tierRate));
        capitalRemaining = capitalRemaining.sub(amountInTier);
        tierIndex++;
      }
    }

    // FORMULA: (primeVariable + basePremium) * (1 - discountPercent/100)
    let prime = primeVariable.add(dcConfig.basePremium);

    // Apply formula discount
    if (dcConfig.discountPercent && dcConfig.discountPercent.gt(0)) {
      const multiplier = new Decimal(1).sub(dcConfig.discountPercent.div(100));
      prime = prime.mul(multiplier);
    }

    // Apply convention reduction
    if (conventionId) {
      const discountPercent = await this.reductionRatesService.getReductionPercent(
        companyId,
        'DOMMAGES_COLLISIONS',
        conventionId,
        capital,
        'DC_CAPITAL' as ReductionMetric,
        FormulaType.DOMMAGES_COLLISIONS,
        usageType,
      );
      prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    }

    return {
      guaranteeCode: 'DOMMAGES_COLLISIONS',
      guaranteeId,
      capital,
      prime,
    };
  }

  private async calculateBG(companyId: string, vehicle: VehicleData, isTousRisques: boolean, selectedCapital?: Decimal, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'BG' } });
    if (!guarantee) return null;

    const capital = selectedCapital ?? vehicle.marketValue;

    if (isTousRisques) {
      return {
        guaranteeCode: 'BG',
        guaranteeId: guarantee.id,
        capital,
        prime: new Decimal(0),
      };
    }

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });

    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }

    if (!rule || rule.ratePercentage === null) return null;

    // FORMULA: (capital * ratePercentage) * (1 - discountPercent/100)
    let prime = capital.mul(rule.ratePercentage);
    
    // Apply formula discount
    if (rule.reductionRate && rule.reductionRate.gt(0)) {
      const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
      prime = prime.mul(multiplier);
    }

    return {
      guaranteeCode: 'BG',
      guaranteeId: guarantee.id,
      capital,
      prime,
    };
  }

  private async getPricingRule(
    companyId: string,
    guaranteeId: string,
    formulaType: FormulaType | null,
    conventionId?: string,
  ) {
    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId,
        isActive: true,
        ...conventionScope,
        OR: [
          { formulaType: formulaType },
          { formulaType: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId,
          isActive: true,
          conventionId: null,
          OR: [
            { formulaType: formulaType },
            { formulaType: null },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return rule;
  }

  private calculateVehicleAge(firstCirculationDate: Date): number {
    const now = new Date();
    const circulation = new Date(firstCirculationDate);
    const age = now.getFullYear() - circulation.getFullYear();
    const hasNotReachedBirthday = now < new Date(now.getFullYear(), circulation.getMonth(), circulation.getDate());
    return hasNotReachedBirthday ? age - 1 : age;
  }

  private async calculateINCENDIE_EMEUTES(companyId: string, vehicle: VehicleData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }
    
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'INCENDIE_EMEUTES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateCATNAT(companyId: string, vehicle: VehicleData, formulaType: FormulaType, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });
    if (!guarantee) {
      console.log('❌ CATNAT: Guarantee not found');
      return null;
    }

    const isTousRisques = formulaType === FormulaType.TOUS_RISQUES_0;
    
    if (!isTousRisques) {
      console.log('❌ CATNAT: Not Tous Risques formula:', formulaType);
      return null;
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.code !== 'AMANA') {
      console.log('❌ CATNAT: Company is not AMANA:', company?.code);
      return null;
    }

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    console.log('🔍 CATNAT: Looking for rule with formulaType:', formulaType);
    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        OR: [
          { formulaType: formulaType },
          { formulaType: null },
        ],
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          OR: [
            { formulaType: formulaType },
            { formulaType: null },
          ],
          isActive: true,
          conventionId: null,
        },
      });
    }
    
    console.log('🔍 CATNAT: Rule found:', rule ? 'YES' : 'NO');
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'CATASTROPHES_NATURELLES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateDOMMAGES_EMEUTES(companyId: string, vehicle: VehicleData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
    if (!guarantee) return null;

    const conventionScope = conventionId ? { conventionId } : { conventionId: null };

    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...conventionScope,
      },
    });
    
    if (!rule && conventionId) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          conventionId: null,
        },
      });
    }
    
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'DOMMAGES_EMEUTES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateDEFENSE_RECOURS(companyId: string, formulaType: FormulaType, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DEFENSE_RECOURS' } });
    if (!guarantee) return null;

    // Prefer a rule specific to the formula (e.g., free for TR 0% if configured), then fallback to general rule
    const specificRule = await this.getPricingRule(companyId, guarantee.id, formulaType, conventionId);
    const rule = specificRule || await this.getPricingRule(companyId, guarantee.id, null, conventionId);
    if (!rule || rule.fixedPremium === null) return null;

    return {
      guaranteeCode: 'DEFENSE_RECOURS',
      guaranteeId: guarantee.id,
      capital: new Decimal(0),
      prime: new Decimal(rule.fixedPremium),
    };
  }
}
