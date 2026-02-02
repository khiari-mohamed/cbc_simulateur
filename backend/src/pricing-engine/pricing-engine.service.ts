import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormulaType, UsageType } from '@prisma/client';
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
    if (!company.contractFees) throw new BadRequestException('Contract fees not configured');
    if (!company.fpac) throw new BadRequestException('FPAC not configured');
    if (!company.fssr) throw new BadRequestException('FSSR not configured');
    if (!company.fg) throw new BadRequestException('FG not configured');
    
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
    if (formulaType === FormulaType.DOMMAGES_COLLISIONS && selectedGuarantees.includes('TOUS_RISQUES_0')) {
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

    // Rule 4: STANDARD formula excludes TOUS_RISQUES_0 and DOMMAGES_COLLISIONS
    if (formulaType === FormulaType.STANDARD) {
      if (selectedGuarantees.includes('TOUS_RISQUES_0') || selectedGuarantees.includes('DOMMAGES_COLLISIONS')) {
        throw new BadRequestException('Standard formula cannot include Tous Risques or Dommages Collision');
      }
    }
  }

  private async calculateRC(companyId: string, vehicle: VehicleData, simulation: SimulationData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'RC' } });
    if (!guarantee) return null;

    // Convert bonusMalus decimal to class (1-8)
    const bonusMalusClass = Math.round(simulation.bonusMalus.toNumber());

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        minPower: { lte: vehicle.fiscalHorsepower },
        maxPower: { gte: vehicle.fiscalHorsepower },
        bonusMalusClass: bonusMalusClass,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

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

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

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

    // Formula: ((marketValue * 2.36) / 1000 + 30) * taux_reduction
    let prime = vehicle.marketValue.mul(new Decimal(2.36)).div(new Decimal(1000)).add(new Decimal(30));

    // Apply reduction rate from pricing rule
    const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'VOL', conventionId);
    prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

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

    // Formula: ((marketValue * 2.75) / 1000 + 30) * taux_reduction
    let prime = vehicle.marketValue.mul(new Decimal(2.75)).div(new Decimal(1000)).add(new Decimal(30));

    // Apply reduction rate from pricing rule
    const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'INCENDIE', conventionId);
    prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

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

    // Get all PTA rules for this company sorted by capital descending
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
      orderBy: { minCapital: 'desc' },
    });

    if (!rules.length) return null;

    // Find matching rule based on selected capital
    let matchedRule = rules[0]; // Default to first (highest capital)
    if (selectedCapital) {
      for (const rule of rules) {
        if (rule.minCapital && selectedCapital.gte(rule.minCapital)) {
          matchedRule = rule;
          break;
        }
      }
    }

    if (!matchedRule.fixedPremium || !matchedRule.minCapital) return null;

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

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

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

    // Apply bonus/malus to franchise rate
    const bonusMalusValue = simulation.bonusMalus.toNumber();
    const adjustedFranchiseRate = franchiseRate;

    // Get franchise-specific rule from database
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        franchiseRate: franchiseRate,
        isActive: true,
        conventionId: conventionId || null,
      },
    });

    if (!rule || !rule.ratePercentage || !rule.fixedPremium) return null;

    // Formula: ((newValue * rate) + fixedPremium) * reductionRate
    let prime = vehicle.newValue.mul(rule.ratePercentage).add(rule.fixedPremium);

    // Apply reduction rate
    const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'TOUS_RISQUES_ZERO', conventionId);
    prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

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

    const capital = selectedCapital || new Decimal(1000);

    if (simulation.usage === 'COMMERCIAL') {
      // For COMMERCIAL (Affaire) - lookup from matrix
      const rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          usageType: 'COMMERCIAL',
          minMarketValue: { lte: vehicle.marketValue },
          OR: [
            { maxMarketValue: { gte: vehicle.marketValue } },
            { maxMarketValue: null }
          ],
          minCapital: capital,
          maxCapital: capital,
          isActive: true,
          conventionId: conventionId || null,
        },
      });

      if (!rule || !rule.fixedPremium) return null;

      let prime = new Decimal(rule.fixedPremium);

      // Apply reduction rate
      const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'DOMMAGES_COLLISIONS', conventionId);
      prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

      return {
        guaranteeCode: 'DOMMAGES_COLLISIONS',
        guaranteeId: guarantee.id,
        capital,
        prime,
      };
    } else {
      // For PRIVATE_BUSINESS (Promenade et Affaire) - tier system
      const baseRule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          basePremium: { not: null },
          usageType: 'PRIVATE_BUSINESS',
          isActive: true,
          conventionId: conventionId || null,
        },
      });

      if (!baseRule || !baseRule.basePremium) return null;

      const tierRules = await this.prisma.pricingRule.findMany({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          tierLevel: { not: null },
          usageType: 'PRIVATE_BUSINESS',
          isActive: true,
          conventionId: conventionId || null,
        },
        orderBy: { tierLevel: 'asc' },
      });

      if (!tierRules.length) return null;

      const vv = vehicle.marketValue;
      let prime = new Decimal(baseRule.basePremium);

      // Calculate percentage of VV
      const capitalPercent = capital.div(vv).mul(100);

      // Apply tiered rates
      if (capitalPercent.lte(10)) {
        const tier1 = tierRules.find(t => t.tierLevel === 1);
        if (tier1?.tierRate) {
          prime = prime.add(capital.mul(tier1.tierRate));
        }
      } else if (capitalPercent.lte(20)) {
        const tier1 = tierRules.find(t => t.tierLevel === 1);
        const tier2 = tierRules.find(t => t.tierLevel === 2);
        if (tier1?.tierRate && tier2?.tierRate) {
          const first10 = vv.mul(new Decimal(0.1)).mul(tier1.tierRate);
          const excess = capital.sub(vv.mul(new Decimal(0.1))).mul(tier2.tierRate);
          prime = prime.add(first10).add(excess);
        }
      } else if (capitalPercent.lte(30)) {
        const tier1 = tierRules.find(t => t.tierLevel === 1);
        const tier2 = tierRules.find(t => t.tierLevel === 2);
        const tier3 = tierRules.find(t => t.tierLevel === 3);
        if (tier1?.tierRate && tier2?.tierRate && tier3?.tierRate) {
          const first10 = vv.mul(new Decimal(0.1)).mul(tier1.tierRate);
          const second10 = vv.mul(new Decimal(0.1)).mul(tier2.tierRate);
          const excess = capital.sub(vv.mul(new Decimal(0.2))).mul(tier3.tierRate);
          prime = prime.add(first10).add(second10).add(excess);
        }
      } else if (capitalPercent.lte(40)) {
        const tier1 = tierRules.find(t => t.tierLevel === 1);
        const tier2 = tierRules.find(t => t.tierLevel === 2);
        const tier3 = tierRules.find(t => t.tierLevel === 3);
        const tier4 = tierRules.find(t => t.tierLevel === 4);
        if (tier1?.tierRate && tier2?.tierRate && tier3?.tierRate && tier4?.tierRate) {
          const first10 = vv.mul(new Decimal(0.1)).mul(tier1.tierRate);
          const second10 = vv.mul(new Decimal(0.1)).mul(tier2.tierRate);
          const third10 = vv.mul(new Decimal(0.1)).mul(tier3.tierRate);
          const excess = capital.sub(vv.mul(new Decimal(0.3))).mul(tier4.tierRate);
          prime = prime.add(first10).add(second10).add(third10).add(excess);
        }
      } else {
        const tier1 = tierRules.find(t => t.tierLevel === 1);
        const tier2 = tierRules.find(t => t.tierLevel === 2);
        const tier3 = tierRules.find(t => t.tierLevel === 3);
        const tier4 = tierRules.find(t => t.tierLevel === 4);
        const tier5 = tierRules.find(t => t.tierLevel === 5);
        if (tier1?.tierRate && tier2?.tierRate && tier3?.tierRate && tier4?.tierRate && tier5?.tierRate) {
          const first10 = vv.mul(new Decimal(0.1)).mul(tier1.tierRate);
          const second10 = vv.mul(new Decimal(0.1)).mul(tier2.tierRate);
          const third10 = vv.mul(new Decimal(0.1)).mul(tier3.tierRate);
          const fourth10 = vv.mul(new Decimal(0.1)).mul(tier4.tierRate);
          const excess = capital.sub(vv.mul(new Decimal(0.4))).mul(tier5.tierRate);
          prime = prime.add(first10).add(second10).add(third10).add(fourth10).add(excess);
        }
      }

      // Apply reduction rate
      const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'DOMMAGES_COLLISIONS', conventionId);
      prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

      return {
        guaranteeCode: 'DOMMAGES_COLLISIONS',
        guaranteeId: guarantee.id,
        capital,
        prime,
      };
    }
  }

  private async calculateBG(companyId: string, vehicle: VehicleData, isTousRisques: boolean, selectedCapital?: Decimal, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'BG' } });
    if (!guarantee) return null;

    const capital = selectedCapital ?? vehicle.marketValue;

    // CDC Rule: BG is FREE if TOUS_RISQUES_0
    if (isTousRisques) {
      return {
        guaranteeCode: 'BG',
        guaranteeId: guarantee.id,
        capital,
        prime: new Decimal(0), // FREE
      };
    }

    // Get BG rate from database
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
    });

    if (!rule || !rule.ratePercentage) return null;

    const prime = capital.mul(rule.ratePercentage);

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
    return this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId,
        isActive: true,
        conventionId: conventionId || null,
        OR: [
          { formulaType: formulaType },
          { formulaType: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
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

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

    return {
      guaranteeCode: 'INCENDIE_EMEUTES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(rule.fixedPremium),
    };
  }

  private async calculateCATNAT(companyId: string, vehicle: VehicleData, formulaType: FormulaType, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });
    if (!guarantee) return null;

    // CDC: AMANA only, 40 DT, only for Tous Risques
    if (formulaType !== FormulaType.TOUS_RISQUES_0) return null;

    // Verify company is AMANA
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.code !== 'AMANA') return null;

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        formulaType: FormulaType.TOUS_RISQUES_0,
        isActive: true,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

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

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: conventionId || null,
      },
    });
    
    if (!rule || !rule.fixedPremium) return null;

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
