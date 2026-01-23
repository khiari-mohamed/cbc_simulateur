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

    // 3. VOL (Optional - Formula: ((marketValue * 2.36) / 1000 + 30) * reductionRate)
    if (simulation.selectedGuarantees.includes('VOL')) {
      const volResult = await this.calculateVOL(companyId, vehicle, conventionId);
      if (volResult) {
        items.push(volResult);
        primeNette = primeNette.add(volResult.prime);
      }
    }

    // 4. INCENDIE (Optional - Formula: ((marketValue * 2.75) / 1000 + 30) * reductionRate)
    if (simulation.selectedGuarantees.includes('INCENDIE')) {
      const incendieResult = await this.calculateINCENDIE(companyId, vehicle, conventionId);
      if (incendieResult) {
        items.push(incendieResult);
        primeNette = primeNette.add(incendieResult.prime);
      }
    }

    // 5. PERSONNES_TRANSPORTEES (Optional - Fixed based on capital)
    if (simulation.selectedGuarantees.includes('PERSONNES_TRANSPORTEES')) {
      const selectedCapital = simulation.selectedCapitals?.['PERSONNES_TRANSPORTEES'];
      const ptResult = await this.calculatePERSONNES_TRANSPORTEES(companyId, selectedCapital, conventionId);
      if (ptResult) {
        items.push(ptResult);
        primeNette = primeNette.add(ptResult.prime);
      }
    }

    // 6. ASSISTANCE (Optional - Fixed 121.000)
    if (simulation.selectedGuarantees.includes('ASSISTANCE')) {
      const assistanceResult = await this.calculateASSISTANCE(companyId, conventionId);
      if (assistanceResult) {
        items.push(assistanceResult);
        primeNette = primeNette.add(assistanceResult.prime);
      }
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
        items.push(incendieEmeutesResult);
        primeNette = primeNette.add(incendieEmeutesResult.prime);
      }
    }

    // 11. CATASTROPHES_NATURELLES (Optional - AMANA only for Tous Risques)
    if (simulation.selectedGuarantees.includes('CATASTROPHES_NATURELLES')) {
      const catnatResult = await this.calculateCATNAT(companyId, vehicle, simulation.formulaType, conventionId);
      if (catnatResult) {
        items.push(catnatResult);
        primeNette = primeNette.add(catnatResult.prime);
      }
    }

    // 12. DOMMAGES_EMEUTES (Optional)
    if (simulation.selectedGuarantees.includes('DOMMAGES_EMEUTES')) {
      const dommagesEmeutesResult = await this.calculateDOMMAGES_EMEUTES(companyId, vehicle, conventionId);
      if (dommagesEmeutesResult) {
        items.push(dommagesEmeutesResult);
        primeNette = primeNette.add(dommagesEmeutesResult.prime);
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
    
    // Excel: LLOYD = 30 DT, AMANA = 20 DT
    const frais = company?.name === 'LLOYD' ? new Decimal(30) : new Decimal(20);
    
    const taxe12Percent = primeNette.mul(0.12);
    const taxe2Percent = primeRC.add(frais).mul(0.02);
    const taxes = taxe12Percent.add(taxe2Percent);
    const fpac = new Decimal(0.5);
    const fssr = new Decimal(0.3);
    const fg = new Decimal(3.0);

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
    if (!guarantee) {
      console.log('❌ RC guarantee not found');
      return null;
    }

    // Find RC pricing rule based on CV (fiscal horsepower)
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        minPower: { lte: vehicle.fiscalHorsepower },
        maxPower: { gte: vehicle.fiscalHorsepower },
        OR: [
          { usageType: simulation.usage },
          { usageType: null },
        ],
        ...(conventionId && { conventionId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!rule || !rule.fixedPremium) {
      console.log('❌ RC pricing rule not found for company:', companyId, 'CV:', vehicle.fiscalHorsepower);
      return null;
    }

    // Apply bonus/malus to base RC premium
    let prime = new Decimal(rule.fixedPremium);
    prime = prime.mul(simulation.bonusMalus);

    return {
      guaranteeCode: 'RC',
      guaranteeId: guarantee.id,
      capital: new Decimal(0), // ILLIMITE
      prime,
    };
  }

  private async calculateCAS(companyId: string, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'CAS' } });
    if (!guarantee) {
      console.log('❌ CAS guarantee not found');
      return null;
    }

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        ...(conventionId && { conventionId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!rule || !rule.fixedPremium) {
      console.log('❌ CAS pricing rule not found for company:', companyId);
      return null;
    }

    const prime = new Decimal(rule.fixedPremium);

    return {
      guaranteeCode: 'CAS',
      guaranteeId: guarantee.id,
      capital: new Decimal(1000),
      prime,
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

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // Excel: LLOYD = 5000/21 or 10000/42, AMANA = 4000/32 or 8000/64
    let capital: Decimal;
    let prime: Decimal;
    
    if (company?.name === 'LLOYD') {
      // Default to 5000/21, but allow 10000/42 if selected
      if (selectedCapital && selectedCapital.gte(10000)) {
        capital = new Decimal(10000);
        prime = new Decimal(42);
      } else {
        capital = new Decimal(5000);
        prime = new Decimal(21);
      }
    } else {
      // AMANA: Default to 4000/32, but allow 8000/64 if selected
      if (selectedCapital && selectedCapital.gte(8000)) {
        capital = new Decimal(8000);
        prime = new Decimal(64);
      } else {
        capital = new Decimal(4000);
        prime = new Decimal(32);
      }
    }

    return {
      guaranteeCode: 'PERSONNES_TRANSPORTEES',
      guaranteeId: guarantee.id,
      capital,
      prime,
    };
  }

  private async calculateASSISTANCE(companyId: string, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
    if (!guarantee) return null;

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // Excel: LLOYD = 115 DT, AMANA = 90 DT
    const prime = company?.name === 'LLOYD' ? new Decimal(115) : new Decimal(90);

    return {
      guaranteeCode: 'ASSISTANCE',
      guaranteeId: guarantee.id,
      capital: new Decimal(0),
      prime,
    };
  }

  private async calculateTOUS_RISQUES_0(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, franchiseRate: number, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
    if (!guarantee) {
      console.log('❌ TOUS_RISQUES_ZERO guarantee not found');
      return null;
    }

    // Get franchise-specific rates from Excel Page 4
    const franchiseRates = {
      0: { rate: new Decimal(0.032), fixed: new Decimal(22) },
      1: { rate: new Decimal(0.0265), fixed: new Decimal(21.75) },
      2: { rate: new Decimal(0.021), fixed: new Decimal(19) },
      4: { rate: new Decimal(0.017), fixed: new Decimal(15) },
    };

    const selectedFranchise = franchiseRates[franchiseRate as keyof typeof franchiseRates] || franchiseRates[0];

    // Formula: ((newValue * rate) + fixedPremium) * reductionRate * bonus/malus
    let prime = vehicle.newValue.mul(selectedFranchise.rate).add(selectedFranchise.fixed);

    // Apply reduction rate
    const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'TOUS_RISQUES_0', conventionId);
    prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

    // Apply bonus/malus
    prime = prime.mul(simulation.bonusMalus);

    return {
      guaranteeCode: 'TOUS_RISQUES_0',
      guaranteeId: guarantee.id,
      capital: vehicle.newValue,
      prime,
    };
  }

  private async calculateDOMMAGES_COLLISIONS(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, selectedCapital?: Decimal, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
    if (!guarantee) return null;

    const capital = selectedCapital || new Decimal(1000);
    const vv = vehicle.marketValue;
    
    // Excel formula: Tiered calculation based on VV ranges and capital tranches
    let prime = new Decimal(10); // Base prime
    
    // Calculate percentage of VV
    const capitalPercent = capital.div(vv).mul(100);
    
    // Tiered rate calculation
    if (capitalPercent.lte(10)) {
      prime = prime.add(capital.mul(new Decimal(0.067)));
    } else if (capitalPercent.lte(20)) {
      const first10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.067));
      const excess = capital.sub(vv.mul(new Decimal(0.1))).mul(new Decimal(0.063));
      prime = prime.add(first10).add(excess);
    } else if (capitalPercent.lte(30)) {
      const first10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.067));
      const second10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.063));
      const excess = capital.sub(vv.mul(new Decimal(0.2))).mul(new Decimal(0.058));
      prime = prime.add(first10).add(second10).add(excess);
    } else if (capitalPercent.lte(40)) {
      const first10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.067));
      const second10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.063));
      const third10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.058));
      const excess = capital.sub(vv.mul(new Decimal(0.3))).mul(new Decimal(0.055));
      prime = prime.add(first10).add(second10).add(third10).add(excess);
    } else {
      const first10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.067));
      const second10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.063));
      const third10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.058));
      const fourth10 = vv.mul(new Decimal(0.1)).mul(new Decimal(0.055));
      const excess = capital.sub(vv.mul(new Decimal(0.4))).mul(new Decimal(0.05));
      prime = prime.add(first10).add(second10).add(third10).add(fourth10).add(excess);
    }

    // Apply reduction rate
    const reductionRate = await this.reductionRatesService.getReductionRate(companyId, 'DOMMAGES_COLLISIONS', conventionId);
    prime = this.reductionRatesService.applyReductionRate(prime, reductionRate);

    // Apply bonus/malus
    prime = prime.mul(simulation.bonusMalus);

    return {
      guaranteeCode: 'DOMMAGES_COLLISIONS',
      guaranteeId: guarantee.id,
      capital,
      prime,
    };
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

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // Excel: LLOYD = 8%, AMANA = 7%
    const rate = company?.name === 'LLOYD' ? new Decimal(0.08) : new Decimal(0.07);
    const prime = capital.mul(rate);

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
        ...(conventionId && { conventionId }),
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

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // Excel: LLOYD = 15 DT, AMANA = NC (not covered)
    if (company?.name === 'AMANA') return null;
    
    const prime = new Decimal(15);

    return {
      guaranteeCode: 'INCENDIE_EMEUTES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime,
    };
  }

  private async calculateCATNAT(companyId: string, vehicle: VehicleData, formulaType: FormulaType, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });
    if (!guarantee) return null;

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // Excel: AMANA only, 40 DT, only for Tous Risques
    if (company?.name !== 'AMANA') return null;
    if (formulaType !== FormulaType.TOUS_RISQUES_0) return null;

    return {
      guaranteeCode: 'CATASTROPHES_NATURELLES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(40),
    };
  }

  private async calculateDOMMAGES_EMEUTES(companyId: string, vehicle: VehicleData, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
    if (!guarantee) return null;

    // Excel: Both LLOYD and AMANA = 30 DT
    return {
      guaranteeCode: 'DOMMAGES_EMEUTES',
      guaranteeId: guarantee.id,
      capital: vehicle.marketValue,
      prime: new Decimal(30),
    };
  }

  private async calculateDEFENSE_RECOURS(companyId: string, formulaType: FormulaType, conventionId?: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'DEFENSE_RECOURS' } });
    if (!guarantee) return null;

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    
    // AMANA: FREE with Tous Risques 0%
    if (company?.name === 'AMANA' && formulaType === FormulaType.TOUS_RISQUES_0) {
      return {
        guaranteeCode: 'DEFENSE_RECOURS',
        guaranteeId: guarantee.id,
        capital: new Decimal(0),
        prime: new Decimal(0), // FREE
      };
    }

    const rule = await this.getPricingRule(companyId, guarantee.id, null, conventionId);
    if (!rule || !rule.fixedPremium) return null;

    return {
      guaranteeCode: 'DEFENSE_RECOURS',
      guaranteeId: guarantee.id,
      capital: new Decimal(0),
      prime: new Decimal(rule.fixedPremium),
    };
  }
}
