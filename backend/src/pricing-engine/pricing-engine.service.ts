  import { Injectable, BadRequestException } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { FormulaType, ReductionMetric, GuaranteeAvailabilityStatus } from '@prisma/client';
  import { Decimal } from '@prisma/client/runtime/library';
  import { ReductionRatesService } from './reduction-rates.service';
  import { FormulaEvaluatorService } from './formula-evaluator.service';
  import { GuaranteeAvailabilityService } from '../guarantee-availability/guarantee-availability.service';
  import { UsageFeeConfigService } from '../usage-fee-config/usage-fee-config.service';

  interface VehicleData {
    fiscalHorsepower: number;
    numberOfSeats: number;
    newValue: Decimal;
    marketValue: Decimal;
    firstCirculationDate: Date;
  }

  interface SimulationData {
    bonusMalus: Decimal;
    usageId: string;
    formulaType: FormulaType;
    selectedGuarantees: string[];
    selectedCapitals?: Record<string, Decimal>;
    franchiseRate?: number;
    fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
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
      isNotCovered?: boolean;
    }>;
    breakdown: {
      primeRC: Decimal;
      taxesDetail: {
        taxe12Percent: Decimal;
        taxe2Percent: Decimal;
      };
    };
    reductions?: Record<string, {
      originalPrime: number;
      discountPercent: number;
      finalPrime: number;
    }>;
  }

  @Injectable()
  export class PricingEngineService {
    constructor(
      private prisma: PrismaService,
      private reductionRatesService: ReductionRatesService,
      private formulaEvaluator: FormulaEvaluatorService,
      private guaranteeAvailabilityService: GuaranteeAvailabilityService,
      private usageFeeConfigService: UsageFeeConfigService,
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

      // Dynamic age validation using formula eligibility rules
      await this.validateBusinessRules(companyId, simulation.formulaType, simulation.usageId, vehicleAge, simulation.selectedGuarantees);

      const items: Array<{
        guaranteeCode: string;
        guaranteeId: string;
        capital: Decimal;
        prime: Decimal;
        reductionInfo?: { originalPrime: number; discountPercent: number; finalPrime: number } | null;
      }> = [];

      let primeNette = new Decimal(0);
      let primeRC = new Decimal(0);
      const reductions: Record<string, { originalPrime: number; discountPercent: number; finalPrime: number }> = {};

      // 1. RC (MANDATORY - Always included)
      const rcResult = await this.calculateRC(companyId, vehicle, simulation, conventionId);
      if (!rcResult) {
        throw new BadRequestException('RC pricing rule not found for company/vehicle combination');
      }
      console.log('✅ RC calculated:', rcResult.prime.toString());
      items.push(rcResult);
      primeNette = primeNette.add(rcResult.prime);
      primeRC = rcResult.prime;

      // 2. CAS (MANDATORY - Always included)
      const casResult = await this.calculateCAS(companyId, conventionId);
      if (!casResult) {
        throw new BadRequestException('CAS pricing rule not found for company');
      }
      console.log('✅ CAS calculated:', casResult.prime.toString());
      items.push(casResult);
      primeNette = primeNette.add(casResult.prime);

      // 3. VOL (MANDATORY - Always included)
      const volResult = await this.calculateVOL(companyId, vehicle, conventionId, simulation.formulaType, simulation.usageId);
      console.log('✅ VOL calculated:', volResult.prime.toString());
      items.push(volResult);
      primeNette = primeNette.add(volResult.prime);
      if (volResult.reductionInfo) {
        reductions['VOL'] = volResult.reductionInfo;
      }

      // 4. INCENDIE (MANDATORY - Always included)
      const incendieResult = await this.calculateINCENDIE(companyId, vehicle, conventionId, simulation.formulaType, simulation.usageId);
      console.log('✅ INCENDIE calculated:', incendieResult.prime.toString());
      items.push(incendieResult);
      primeNette = primeNette.add(incendieResult.prime);
      if (incendieResult.reductionInfo) {
        reductions['INCENDIE'] = incendieResult.reductionInfo;
      }

      // 5. PERSONNES_TRANSPORTEES (MANDATORY - Always included)
      const selectedCapital = simulation.selectedCapitals?.['PERSONNES_TRANSPORTEES'];
      const ptResult = await this.calculatePERSONNES_TRANSPORTEES(companyId, selectedCapital, conventionId);
      if (!ptResult) {
        throw new BadRequestException('PERSONNES_TRANSPORTEES pricing rule not found for company');
      }
      console.log('✅ PTA calculated:', ptResult.prime.toString());
      items.push(ptResult);
      primeNette = primeNette.add(ptResult.prime);

      // 6. ASSISTANCE (MANDATORY - Always included)
      const assistanceResult = await this.calculateASSISTANCE(companyId, conventionId);
      if (!assistanceResult) {
        throw new BadRequestException('ASSISTANCE pricing rule not found for company');
      }
      console.log('✅ ASSISTANCE calculated:', assistanceResult.prime.toString());
      items.push(assistanceResult);
      primeNette = primeNette.add(assistanceResult.prime);

      // 7. TOUS_RISQUES_0 (Only if formula is TOUS_RISQUES_0)
      if (simulation.formulaType === FormulaType.TOUS_RISQUES_0) {
        const franchiseRate = simulation.franchiseRate ?? 0;
        const trResult = await this.calculateTOUS_RISQUES_0(companyId, vehicle, vehicleAge, simulation, franchiseRate, conventionId, simulation.usageId);
        if (trResult) {
          console.log('✅ TOUS_RISQUES_0 calculated:', trResult.prime.toString());
          items.push(trResult);
          primeNette = primeNette.add(trResult.prime);
          if (trResult.reductionInfo) {
            reductions['TOUS_RISQUES_ZERO'] = trResult.reductionInfo;
          }
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
          if (dcResult.reductionInfo) {
            reductions['DOMMAGES_COLLISIONS'] = dcResult.reductionInfo;
          }
        }
      }

      // 9. BG (Bris de Glaces) - Check availability config
      if (simulation.selectedGuarantees.includes('BG') || simulation.formulaType === FormulaType.TOUS_RISQUES_0) {
        const bgAvailability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_BRIS_GLACES', simulation.formulaType, simulation.franchiseRate);
        
        if (bgAvailability.isAvailable) {
          const selectedCapital = simulation.selectedCapitals?.['BG'];
          
          // 🔥 IMPORTANT: Trust ONLY the availability config from backend
          // Backend now handles franchise rate logic - BG is only free when config says GRATUIT AND franchiseRate === 0
          const isFree = bgAvailability.isFree;
          
          const bgResult = await this.calculateBG(
            companyId,
            vehicle,
            isFree,
            selectedCapital,
            conventionId,
            simulation.selectedGuarantees.includes('BG'),
          );
          if (bgResult) {
            items.push(bgResult);
            primeNette = primeNette.add(bgResult.prime);
            if (bgResult.reductionInfo) {
              reductions['BG'] = bgResult.reductionInfo;
            }
          }
        }
      }

      // 10. INCENDIE_EMEUTES (Optional) - Check availability
      if (simulation.selectedGuarantees.includes('INCENDIE_EMEUTES')) {
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_INCENDIE_EMEUTES', simulation.formulaType);
        
        if (availability.isAvailable) {
          // If NON_ACCORDEE, create a dummy entry with 0 DT even if no pricing rule exists
          if (availability.isNotCovered) {
            const guarantee = await this.prisma.guarantee.findFirst({ 
              where: { systemRole: 'OPTIONAL_INCENDIE_EMEUTES', isActive: true } 
            });
            if (guarantee) {
              const incendieEmeutesResult = {
                guaranteeCode: 'INCENDIE_EMEUTES',
                guaranteeId: guarantee.id,
                capital: vehicle.marketValue,
                prime: new Decimal(0),
                isNotCovered: true,
              };
              console.log('✅ INCENDIE_EMEUTES (NON ACCORDÉE) included:', incendieEmeutesResult.prime.toString());
              items.push(incendieEmeutesResult);
            }
          } else {
            // Normal case: try to calculate premium
            const incendieEmeutesResult = await this.calculateINCENDIE_EMEUTES(companyId, vehicle, conventionId);
            if (incendieEmeutesResult) {
              // Override price if configured as GRATUIT
              if (availability.isFree) {
                incendieEmeutesResult.prime = new Decimal(0);
              }
              console.log('✅ INCENDIE_EMEUTES calculated:', incendieEmeutesResult.prime.toString());
              items.push(incendieEmeutesResult);
              primeNette = primeNette.add(incendieEmeutesResult.prime);
            } else {
              console.log('❌ INCENDIE_EMEUTES NOT calculated - no pricing rule found');
            }
          }
        } else {
          console.log('❌ INCENDIE_EMEUTES NOT available - blocked by availability config');
        }
      } else {
        // Check if it's NON_ACCORDEE - if so, include it automatically
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_INCENDIE_EMEUTES', simulation.formulaType);
        if (availability.isNotCovered) {
          const guarantee = await this.prisma.guarantee.findFirst({ 
            where: { systemRole: 'OPTIONAL_INCENDIE_EMEUTES', isActive: true } 
          });
          if (guarantee) {
            const incendieEmeutesResult = {
              guaranteeCode: 'INCENDIE_EMEUTES',
              guaranteeId: guarantee.id,
              capital: vehicle.marketValue,
              prime: new Decimal(0),
              isNotCovered: true,
            };
            console.log('✅ INCENDIE_EMEUTES (NON ACCORDÉE - auto-included):', incendieEmeutesResult.prime.toString());
            items.push(incendieEmeutesResult);
          }
        }
      }

      // 11. CATASTROPHES_NATURELLES (Optional) - Check availability
      if (simulation.selectedGuarantees.includes('CATASTROPHES_NATURELLES')) {
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_CATASTROPHES_NATURELLES', simulation.formulaType);
        
        if (availability.isAvailable) {
          const catnatResult = await this.calculateCATNAT(companyId, vehicle, simulation.formulaType, conventionId);
          if (catnatResult) {
            // Override price if configured as GRATUIT
            if (availability.isFree) {
              catnatResult.prime = new Decimal(0);
            }
            // Set isNotCovered flag from availability
            catnatResult.isNotCovered = availability.isNotCovered;
            // ✅ FIX NOTE 6: Force prime to 0 for NON_ACCORDEE guarantees
            if (availability.isNotCovered) {
              catnatResult.prime = new Decimal(0);
            }
            console.log('✅ CATASTROPHES_NATURELLES calculated:', catnatResult.prime.toString());
            items.push(catnatResult);
            // ✅ FIX NOTE 6: Only add to primeNette if NOT covered
            if (!availability.isNotCovered) {
              primeNette = primeNette.add(catnatResult.prime);
            }
          } else {
            console.log('❌ CATASTROPHES_NATURELLES NOT calculated - no pricing rule found or not Tous Risques 0%');
          }
        } else {
          console.log('❌ CATASTROPHES_NATURELLES NOT available - blocked by availability config');
        }
      } else {
        // Check if it's NON_ACCORDEE - if so, include it automatically
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_CATASTROPHES_NATURELLES', simulation.formulaType);
        if (availability.isNotCovered) {
          const catnatResult = await this.calculateCATNAT(companyId, vehicle, simulation.formulaType, conventionId);
          if (catnatResult) {
            catnatResult.prime = new Decimal(0);
            catnatResult.isNotCovered = true;
            console.log('✅ CATASTROPHES_NATURELLES (NON ACCORDÉE) included:', catnatResult.prime.toString());
            items.push(catnatResult);
          }
        }
      }

      // 12. DOMMAGES_EMEUTES (Optional) - Check availability
      if (simulation.selectedGuarantees.includes('DOMMAGES_EMEUTES')) {
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_DOMMAGES_EMEUTES', simulation.formulaType);
        
        if (availability.isAvailable) {
          const dommagesEmeutesResult = await this.calculateDOMMAGES_EMEUTES(companyId, vehicle, conventionId);
          if (dommagesEmeutesResult) {
            // Override price if configured as GRATUIT
            if (availability.isFree) {
              dommagesEmeutesResult.prime = new Decimal(0);
            }
            // Set isNotCovered flag from availability
            dommagesEmeutesResult.isNotCovered = availability.isNotCovered;
            // ✅ FIX NOTE 6: Force prime to 0 for NON_ACCORDEE guarantees
            if (availability.isNotCovered) {
              dommagesEmeutesResult.prime = new Decimal(0);
            }
            console.log('✅ DOMMAGES_EMEUTES calculated:', dommagesEmeutesResult.prime.toString());
            items.push(dommagesEmeutesResult);
            // ✅ FIX NOTE 6: Only add to primeNette if NOT covered
            if (!availability.isNotCovered) {
              primeNette = primeNette.add(dommagesEmeutesResult.prime);
            }
          } else {
            console.log('❌ DOMMAGES_EMEUTES NOT calculated - no pricing rule found');
          }
        } else {
          console.log('❌ DOMMAGES_EMEUTES NOT available - blocked by availability config');
        }
      } else {
        // Check if it's NON_ACCORDEE - if so, include it automatically
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_DOMMAGES_EMEUTES', simulation.formulaType);
        if (availability.isNotCovered) {
          const dommagesEmeutesResult = await this.calculateDOMMAGES_EMEUTES(companyId, vehicle, conventionId);
          if (dommagesEmeutesResult) {
            dommagesEmeutesResult.prime = new Decimal(0);
            dommagesEmeutesResult.isNotCovered = true;
            console.log('✅ DOMMAGES_EMEUTES (NON ACCORDÉE) included:', dommagesEmeutesResult.prime.toString());
            items.push(dommagesEmeutesResult);
          }
        }
      }

      // 13. DEFENSE_RECOURS (Optional) - Check availability
      if (simulation.selectedGuarantees.includes('DEFENSE_RECOURS')) {
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_DEFENSE_RECOURS', simulation.formulaType);
        
        if (availability.isAvailable) {
          const defenseRecoursResult = await this.calculateDEFENSE_RECOURS(companyId, simulation.formulaType, conventionId);
          if (defenseRecoursResult) {
            // Override price if configured as GRATUIT
            if (availability.isFree) {
              defenseRecoursResult.prime = new Decimal(0);
            }
            items.push(defenseRecoursResult);
            primeNette = primeNette.add(defenseRecoursResult.prime);
          }
        } else {
          console.log('❌ DEFENSE_RECOURS NOT available - blocked by availability config');
        }
      }

      // 14. ASSURANCE_CONDUCTEUR (Optional) - Check availability
      if (simulation.selectedGuarantees.includes('ASSURANCE_CONDUCTEUR')) {
        const availability = await this.checkGuaranteeAvailability(companyId, 'OPTIONAL_ASSURANCE_CONDUCTEUR', simulation.formulaType);
        
        if (availability.isAvailable) {
          const selectedCapital = simulation.selectedCapitals?.['ASSURANCE_CONDUCTEUR'];
          const assuranceConducteurResult = await this.calculateASSURANCE_CONDUCTEUR(companyId, selectedCapital, conventionId);
          if (assuranceConducteurResult) {
            // Override price if configured as GRATUIT
            if (availability.isFree) {
              assuranceConducteurResult.prime = new Decimal(0);
            }
            console.log('✅ ASSURANCE_CONDUCTEUR calculated:', assuranceConducteurResult.prime.toString());
            items.push(assuranceConducteurResult);
            primeNette = primeNette.add(assuranceConducteurResult.prime);
          } else {
            console.log('❌ ASSURANCE_CONDUCTEUR NOT calculated - no pricing rule found');
          }
        } else {
          console.log('❌ ASSURANCE_CONDUCTEUR NOT available - blocked by availability config');
        }
      }

      const fractionnement = simulation.fractionnement ?? 'ANNUEL';
      const pricingItems = fractionnement === 'SEMESTRIEL'
        ? items.map((item) => ({
            ...item,
            prime: item.prime.div(2),
          }))
        : items;

      if (fractionnement === 'SEMESTRIEL') {
        primeNette = pricingItems.reduce((sum, item) => sum.add(item.prime), new Decimal(0));

        const rcItem = pricingItems.find((item) => item.guaranteeCode === 'RC');
        primeRC = rcItem?.prime ?? new Decimal(0);
      }

      // CDC EXACT CALCULATION
      const company = await this.prisma.company.findUnique({ where: { id: companyId } });
      if (!company) throw new BadRequestException('Company not found');
      
      // Try to get usage-specific fees first, fallback to company fees
      const usageFeeConfig = await this.usageFeeConfigService.getByUsageAndCompany(
        simulation.usageId,
        companyId,
      );

      // Use usage-specific fees if configured, otherwise fall back to company fees
      const feeSource = usageFeeConfig ?? company;

      // Log when fallback is used (for monitoring)
      if (!usageFeeConfig) {
        console.warn(
          `⚠️  No UsageFeeConfig found for usage ${simulation.usageId} and company ${companyId}. Falling back to company fees.`,
        );
      }
      
      // Get all values from fee source - NO FALLBACKS
      if (feeSource.contractFees === null) throw new BadRequestException('Contract fees not configured');
      if (feeSource.fpac === null) throw new BadRequestException('FPAC not configured');
      if (feeSource.fssr === null) throw new BadRequestException('FSSR not configured');
      if (feeSource.fg === null) throw new BadRequestException('FG not configured');
      
      const frais = new Decimal(feeSource.contractFees);
      const fpac = new Decimal(feeSource.fpac);
      const fssr = new Decimal(feeSource.fssr);
      const fg = new Decimal(feeSource.fg);
      
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
        items: pricingItems,
        breakdown: {
          primeRC,
          taxesDetail: {
            taxe12Percent,
            taxe2Percent,
          },
        },
        reductions,
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

    private async validateBusinessRules(
      companyId: string,
      formulaType: FormulaType,
      usageId: string,
      vehicleAge: number,
      selectedGuarantees: string[],
    ) {
      // Rule 1: DOMMAGES_COLLISIONS and TOUS_RISQUES_0 are mutually exclusive
      if (formulaType === FormulaType.DOMMAGES_COLLISIONS && selectedGuarantees.includes('TOUS_RISQUES_ZERO')) {
        throw new BadRequestException('Dommages Collision cannot be combined with Tous Risques');
      }

      // Rule 2: Dynamic age validation using formula eligibility rules
      const eligibilityRule = await this.prisma.formulaEligibilityAgeRule.findFirst({
        where: {
          companyId,
          usageId,
          formulaType,
          isActive: true,
        },
      });

      if (eligibilityRule) {
        // Check min age (if specified)
        if (eligibilityRule.minAgeYears !== null && eligibilityRule.minAgeYears !== undefined) {
          if (vehicleAge < eligibilityRule.minAgeYears) {
            throw new BadRequestException(
              `Le véhicule doit avoir au moins ${eligibilityRule.minAgeYears} an(s) pour la formule ${formulaType} (âge actuel: ${vehicleAge} an(s))`,
            );
          }
        }

        // Check max age (if specified)
        if (eligibilityRule.maxAgeYears !== null && eligibilityRule.maxAgeYears !== undefined) {
          if (vehicleAge >= eligibilityRule.maxAgeYears) {
            throw new BadRequestException(
              `Le véhicule doit avoir moins de ${eligibilityRule.maxAgeYears} an(s) pour la formule ${formulaType} (âge actuel: ${vehicleAge} an(s))`,
            );
          }
        }
      }

      // Rule 3: STANDARD formula excludes TOUS_RISQUES_ZERO and DOMMAGES_COLLISIONS
      if (formulaType === FormulaType.STANDARD) {
        if (selectedGuarantees.includes('TOUS_RISQUES_ZERO') || selectedGuarantees.includes('DOMMAGES_COLLISIONS')) {
          throw new BadRequestException('Standard formula cannot include Tous Risques or Dommages Collision');
        }
      }
    }

    private async calculateRC(companyId: string, vehicle: VehicleData, simulation: SimulationData, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_RC', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Responsabilité Civile (MANDATORY_RC)');
      }

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
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_CAS', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for CAS (MANDATORY_CAS)');
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
      
      if (!rule || rule.fixedPremium === null) return null;

      return {
        guaranteeCode: 'CAS',
        guaranteeId: guarantee.id,
        capital: new Decimal(1000),
        prime: new Decimal(rule.fixedPremium),
      };
    }

    private async calculateVOL(companyId: string, vehicle: VehicleData, conventionId?: string, formulaType?: FormulaType, usageId?: string): Promise<{
      guaranteeCode: string;
      guaranteeId: string;
      capital: Decimal;
      prime: Decimal;
      reductionInfo?: { originalPrime: number; discountPercent: number; finalPrime: number } | null;
    }> {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_VOL', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Vol (MANDATORY_VOL)');
      }

      const conventionScope = conventionId ? { conventionId } : { conventionId: null };

      let rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          ...conventionScope,
          AND: [
            {
              OR: [
                { minMarketValue: null },
                { minMarketValue: { lte: vehicle.marketValue } },
              ],
            },
            {
              OR: [
                { maxMarketValue: null },
                { maxMarketValue: { gte: vehicle.marketValue } },
              ],
            },
          ],
        },
      });
      
      if (!rule && conventionId) {
        rule = await this.prisma.pricingRule.findFirst({
          where: {
            companyId,
            guaranteeId: guarantee.id,
            isActive: true,
            conventionId: null,
            AND: [
              {
                OR: [
                  { minMarketValue: null },
                  { minMarketValue: { lte: vehicle.marketValue } },
                ],
              },
              {
                OR: [
                  { maxMarketValue: null },
                  { maxMarketValue: { gte: vehicle.marketValue } },
                ],
              },
            ],
          },
        });
      }

      if (!rule) {
        throw new BadRequestException(`VOL pricing rule not found for company and vehicle market value ${vehicle.marketValue} DT`);
      }

      // Determine which value to use based on referenceValue field
      const useNewValue = rule.referenceValue === 'NEW_VALUE';
      const referenceValue = useNewValue ? vehicle.newValue : vehicle.marketValue;

      let prime: Decimal;

      // Use custom formula if provided
      if (rule.formula) {
        const variables = {
          VV: vehicle.marketValue.toNumber(),
          VN: vehicle.newValue.toNumber(),
          rate: rule.ratePercentage?.toNumber() || 0,
          fixed: rule.fixedPremium?.toNumber() || 0,
          reduction: rule.reductionRate ? (1 - rule.reductionRate.toNumber() / 100) : 1,
        };
        prime = new Decimal(this.formulaEvaluator.evaluateFormula(rule.formula, variables));
      } else {
        // Fallback to hardcoded formula
        if (rule.ratePercentage === null || rule.fixedPremium === null) {
          throw new BadRequestException('VOL pricing rule is missing required fields (ratePercentage or fixedPremium)');
        }
        prime = referenceValue.mul(rule.ratePercentage).add(rule.fixedPremium);
        
        if (rule.reductionRate && rule.reductionRate.gt(0)) {
          const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
          prime = prime.mul(multiplier);
        }
      }

      // Apply convention reduction if exists
      let reductionInfo = null;
      if (conventionId) {
        // For TR 0%, use NEW_VALUE metric; for other formulas, use MARKET_VALUE
        const metricValue = formulaType === FormulaType.TOUS_RISQUES_0 ? vehicle.newValue : vehicle.marketValue;
        const metric = formulaType === FormulaType.TOUS_RISQUES_0 ? 'NEW_VALUE' : 'MARKET_VALUE';
        const discountPercent = await this.reductionRatesService.getReductionPercent(
          companyId,
          'MANDATORY_VOL',
          conventionId,
          metricValue,
          metric as ReductionMetric,
          formulaType,
          usageId,
        );
        if (discountPercent > 0) {
          const originalPrime = prime;
          prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
          reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
        }
      }

      return {
        guaranteeCode: 'VOL',
        guaranteeId: guarantee.id,
        capital: referenceValue,
        prime,
        reductionInfo,
      };
    }

    private async calculateINCENDIE(companyId: string, vehicle: VehicleData, conventionId?: string, formulaType?: FormulaType, usageId?: string): Promise<{
      guaranteeCode: string;
      guaranteeId: string;
      capital: Decimal;
      prime: Decimal;
      reductionInfo?: { originalPrime: number; discountPercent: number; finalPrime: number } | null;
    }> {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_INCENDIE', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Incendie (MANDATORY_INCENDIE)');
      }

      const conventionScope = conventionId ? { conventionId } : { conventionId: null };

      let rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          ...conventionScope,
          AND: [
            {
              OR: [
                { minMarketValue: null },
                { minMarketValue: { lte: vehicle.marketValue } },
              ],
            },
            {
              OR: [
                { maxMarketValue: null },
                { maxMarketValue: { gte: vehicle.marketValue } },
              ],
            },
          ],
        },
      });
      
      if (!rule && conventionId) {
        rule = await this.prisma.pricingRule.findFirst({
          where: {
            companyId,
            guaranteeId: guarantee.id,
            isActive: true,
            conventionId: null,
            AND: [
              {
                OR: [
                  { minMarketValue: null },
                  { minMarketValue: { lte: vehicle.marketValue } },
                ],
              },
              {
                OR: [
                  { maxMarketValue: null },
                  { maxMarketValue: { gte: vehicle.marketValue } },
                ],
              },
            ],
          },
        });
      }

      if (!rule) {
        throw new BadRequestException(`INCENDIE pricing rule not found for company and vehicle market value ${vehicle.marketValue} DT`);
      }

      // Determine which value to use based on referenceValue field
      const useNewValue = rule.referenceValue === 'NEW_VALUE';
      const referenceValue = useNewValue ? vehicle.newValue : vehicle.marketValue;

      let prime: Decimal;

      // Use custom formula if provided
      if (rule.formula) {
        const variables = {
          VV: vehicle.marketValue.toNumber(),
          VN: vehicle.newValue.toNumber(),
          rate: rule.ratePercentage?.toNumber() || 0,
          fixed: rule.fixedPremium?.toNumber() || 0,
          reduction: rule.reductionRate ? (1 - rule.reductionRate.toNumber() / 100) : 1,
        };
        prime = new Decimal(this.formulaEvaluator.evaluateFormula(rule.formula, variables));
      } else {
        // Fallback to hardcoded formula
        if (rule.ratePercentage === null || rule.fixedPremium === null) {
          throw new BadRequestException('INCENDIE pricing rule is missing required fields (ratePercentage or fixedPremium)');
        }
        prime = referenceValue.mul(rule.ratePercentage).add(rule.fixedPremium);
        
        if (rule.reductionRate && rule.reductionRate.gt(0)) {
          const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
          prime = prime.mul(multiplier);
        }
      }

      // Apply convention reduction if exists
      let reductionInfo = null;
      if (conventionId) {
        // For TR 0%, use NEW_VALUE metric; for other formulas, use MARKET_VALUE
        const metricValue = formulaType === FormulaType.TOUS_RISQUES_0 ? vehicle.newValue : vehicle.marketValue;
        const metric = formulaType === FormulaType.TOUS_RISQUES_0 ? 'NEW_VALUE' : 'MARKET_VALUE';
        const discountPercent = await this.reductionRatesService.getReductionPercent(
          companyId,
          'MANDATORY_INCENDIE',
          conventionId,
          metricValue,
          metric as ReductionMetric,
          formulaType,
          usageId,
        );
        if (discountPercent > 0) {
          const originalPrime = prime;
          prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
          reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
        }
      }

      return {
        guaranteeCode: 'INCENDIE',
        guaranteeId: guarantee.id,
        capital: referenceValue,
        prime,
        reductionInfo,
      };
    }

    private async calculatePERSONNES_TRANSPORTEES(companyId: string, selectedCapital?: Decimal, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_PERSONNES_TRANSPORTEES', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Personnes Transportées (MANDATORY_PERSONNES_TRANSPORTEES)');
      }

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
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'MANDATORY_ASSISTANCE', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Assistance (MANDATORY_ASSISTANCE)');
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
      
      if (!rule || rule.fixedPremium === null) return null;

      return {
        guaranteeCode: 'ASSISTANCE',
        guaranteeId: guarantee.id,
        capital: new Decimal(0),
        prime: new Decimal(rule.fixedPremium),
      };
    }

    private async calculateTOUS_RISQUES_0(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, franchiseRate: number, conventionId?: string, usageId?: string): Promise<{
      guaranteeCode: string;
      guaranteeId: string;
      capital: Decimal;
      prime: Decimal;
      reductionInfo?: { originalPrime: number; discountPercent: number; finalPrime: number } | null;
    } | null> {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_TOUS_RISQUES', isActive: true } 
      });
      if (!guarantee) {
        console.log('❌ TOUS_RISQUES_ZERO guarantee not found');
        throw new BadRequestException('No guarantee configured for Tous Risques (OPTIONAL_TOUS_RISQUES)');
      }

      const conventionScope = conventionId ? { conventionId } : { conventionId: null };

      let rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          franchiseRate: franchiseRate,
          isActive: true,
          ...conventionScope,
          AND: [
            {
              OR: [
                { minMarketValue: null },
                { minMarketValue: { lte: vehicle.newValue } },
              ],
            },
            {
              OR: [
                { maxMarketValue: null },
                { maxMarketValue: { gte: vehicle.newValue } },
              ],
            },
          ],
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
            AND: [
              {
                OR: [
                  { minMarketValue: null },
                  { minMarketValue: { lte: vehicle.newValue } },
                ],
              },
              {
                OR: [
                  { maxMarketValue: null },
                  { maxMarketValue: { gte: vehicle.newValue } },
                ],
              },
            ],
          },
        });
      }

      if (!rule) {
        throw new BadRequestException(`TOUS_RISQUES_0 pricing rule not found for company, franchise ${franchiseRate}%, and vehicle new value ${vehicle.newValue} DT`);
      }

      let prime: Decimal;

      // Use custom formula if provided
      if (rule.formula) {
        const variables = {
          VN: vehicle.newValue.toNumber(),
          rate: rule.ratePercentage?.toNumber() || 0,
          fixed: rule.fixedPremium?.toNumber() || 0,
          reduction: rule.reductionRate ? (1 - rule.reductionRate.toNumber() / 100) : 1,
          franchise: franchiseRate,
        };
        prime = new Decimal(this.formulaEvaluator.evaluateFormula(rule.formula, variables));
      } else {
        // Fallback to hardcoded formula
        if (rule.ratePercentage === null || rule.fixedPremium === null) return null;
        prime = vehicle.newValue.mul(rule.ratePercentage).add(rule.fixedPremium);
        
        if (rule.reductionRate && rule.reductionRate.gt(0)) {
          const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
          prime = prime.mul(multiplier);
        }
      }

      let reductionInfo = null;
      if (conventionId) {
        const discountPercent = await this.reductionRatesService.getReductionPercent(
          companyId,
          'OPTIONAL_TOUS_RISQUES',
          conventionId,
          vehicle.newValue,
          'NEW_VALUE' as ReductionMetric,
          FormulaType.TOUS_RISQUES_0,
          usageId,
        );
        if (discountPercent > 0) {
          const originalPrime = prime;
          prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
          reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
        }
      }

      return {
        guaranteeCode: 'TOUS_RISQUES_ZERO',
        guaranteeId: guarantee.id,
        capital: vehicle.newValue,
        prime,
        reductionInfo,
      };
    }

    private async calculateDOMMAGES_COLLISIONS(companyId: string, vehicle: VehicleData, vehicleAge: number, simulation: SimulationData, selectedCapital?: Decimal, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_DOMMAGES_COLLISIONS', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Dommages Collisions (OPTIONAL_DOMMAGES_COLLISIONS)');
      }

      const vv = vehicle.marketValue;

      // Get DC config for this usage type
      const dcConfig = await this.prisma.dcConfig.findFirst({
        where: { 
          companyId,
          usageId: simulation.usageId,
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
      // ⚠️ IMPORTANT: This validation applies ONLY to PROGRESSIVE method (LLOYD)
      // For MATRIX method (AL BARAKA), the matrix itself defines available capitals
      if (!dcConfig.useMatrix) {
        const percentCeiling = vv.mul(dcConfig.maxCapitalPercent.div(100));
        const effectiveCeiling = percentCeiling.lt(dcConfig.maxCapitalAbsolute) 
          ? percentCeiling 
          : dcConfig.maxCapitalAbsolute;
        
        if (requestedCapital.gt(effectiveCeiling)) {
          throw new BadRequestException(`Capital cannot exceed ${effectiveCeiling.toFixed(2)} DT`);
        }
      }

      // Validate capital steps
      const isValidStep = await this.validateCapitalStep(companyId, simulation.usageId, requestedCapital);
      if (!isValidStep) {
        throw new BadRequestException('Capital does not match allowed increments');
      }

      const capital = requestedCapital;

      if (dcConfig.useMatrix) {
        return await this.calculateDC_Matrix(companyId, guarantee.id, vv, capital, dcConfig, simulation.usageId, conventionId);
      } else {
        return await this.calculateDC_Progressive(companyId, guarantee.id, vv, capital, dcConfig, simulation.usageId, conventionId);
      }
    }

    private async validateCapitalStep(companyId: string, usageId: string, capital: Decimal): Promise<boolean> {
      const tiers = await this.prisma.dcCapitalTier.findMany({
        where: { companyId, usageId, isActive: true },
        orderBy: { minAmount: 'asc' },
      });

      console.log(`[validateCapitalStep] Capital: ${capital}, UsageId: ${usageId}`);
      console.log(`[validateCapitalStep] Found ${tiers.length} tiers`);

      for (const tier of tiers) {
        console.log(`[validateCapitalStep] Checking tier: min=${tier.minAmount}, max=${tier.maxAmount}, step=${tier.step}`);
        if (capital.gte(tier.minAmount) && (!tier.maxAmount || capital.lte(tier.maxAmount))) {
          const offset = capital.sub(tier.minAmount);
          const remainder = offset.mod(tier.step);
          console.log(`[validateCapitalStep] Capital ${capital} in range: offset=${offset}, remainder=${remainder}`);
          return remainder.eq(0);
        }
      }

      console.log(`[validateCapitalStep] ❌ Capital ${capital} not in any tier range`);
      return false;
    }

    private async calculateDC_Matrix(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageId: string, conventionId?: string) {
      // Find matching VV range for this usage type
      const vvRange = await this.prisma.dcMatrixVvRange.findFirst({
        where: {
          companyId,
          usageId,
          minVv: { lte: vv },
          OR: [
            { maxVv: { gte: vv } },
            { maxVv: null },
          ],
          isActive: true,
        },
      });

      if (!vvRange) {
        throw new BadRequestException(`No matrix VV range found for usage ${usageId} and VV ${vv}`);
      }

      // Find matching capital for this usage type
      const capitalEntry = await this.prisma.dcMatrixCapital.findFirst({
        where: {
          companyId,
          usageId,
          amount: capital,
          isActive: true,
        },
      });

      if (!capitalEntry) {
        throw new BadRequestException(`No matrix capital found for usage ${usageId} and capital ${capital}`);
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

      // Apply per-range reduction if available, otherwise use global discount
      const reductionToApply = vvRange.reductionRate !== null && vvRange.reductionRate !== undefined
        ? vvRange.reductionRate
        : dcConfig.discountPercent;

      if (reductionToApply && new Decimal(reductionToApply).gt(0)) {
        const multiplier = new Decimal(1).sub(new Decimal(reductionToApply).div(100));
        prime = prime.mul(multiplier);
      }

      // Apply convention reduction - check which metric is configured
      let reductionInfo = null;
      if (conventionId) {
        const guarantee = await this.prisma.guarantee.findFirst({
          where: { systemRole: 'OPTIONAL_DOMMAGES_COLLISIONS', isActive: true }
        });

        if (guarantee) {
          const dcCapitalRule = await this.prisma.conventionReductionRule.findFirst({
            where: {
              conventionId,
              guaranteeId: guarantee.id,
              metric: 'DC_CAPITAL',
              isActive: true,
              validFrom: { lte: new Date() },
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
            }
          });

          const marketValueRule = await this.prisma.conventionReductionRule.findFirst({
            where: {
              conventionId,
              guaranteeId: guarantee.id,
              metric: 'MARKET_VALUE',
              isActive: true,
              validFrom: { lte: new Date() },
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
            }
          });

          let discountPercent = 0;
          if (dcCapitalRule) {
            discountPercent = await this.reductionRatesService.getReductionPercent(
              companyId,
              'OPTIONAL_DOMMAGES_COLLISIONS',
              conventionId,
              capital,
              'DC_CAPITAL' as ReductionMetric,
              FormulaType.DOMMAGES_COLLISIONS,
              usageId,
            );
          } else if (marketValueRule) {
            discountPercent = await this.reductionRatesService.getReductionPercent(
              companyId,
              'OPTIONAL_DOMMAGES_COLLISIONS',
              conventionId,
              vv,
              'MARKET_VALUE' as ReductionMetric,
              FormulaType.DOMMAGES_COLLISIONS,
              usageId,
            );
          }

          if (discountPercent > 0) {
            const originalPrime = prime;
            prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
            reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
          }
        }
      }

      return {
        guaranteeCode: 'DOMMAGES_COLLISIONS',
        guaranteeId,
        capital,
        prime,
        reductionInfo,
      };
    }

    private async calculateDC_CommercialLegacy(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageId: string, conventionId?: string) {
      const conventionScope = conventionId ? { conventionId } : { conventionId: null };

      let rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId,
          usageId,
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
            usageId,
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
          'OPTIONAL_DOMMAGES_COLLISIONS',
          conventionId,
          capital,
          'DC_CAPITAL' as ReductionMetric,
          FormulaType.DOMMAGES_COLLISIONS,
          usageId,
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

    private async calculateDC_Progressive(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageId: string, conventionId?: string) {
      // Get progressive tiers for this usage type
      const tiers = await this.prisma.dcProgressiveTier.findMany({
        where: {
          companyId,
          usageId,
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

      // Apply convention reduction - check which metric is configured
      let reductionInfo = null;
      if (conventionId) {
        const guarantee = await this.prisma.guarantee.findFirst({
          where: { systemRole: 'OPTIONAL_DOMMAGES_COLLISIONS', isActive: true }
        });

        if (guarantee) {
          const dcCapitalRule = await this.prisma.conventionReductionRule.findFirst({
            where: {
              conventionId,
              guaranteeId: guarantee.id,
              metric: 'DC_CAPITAL',
              isActive: true,
              validFrom: { lte: new Date() },
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
            }
          });

          const marketValueRule = await this.prisma.conventionReductionRule.findFirst({
            where: {
              conventionId,
              guaranteeId: guarantee.id,
              metric: 'MARKET_VALUE',
              isActive: true,
              validFrom: { lte: new Date() },
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
            }
          });

          let discountPercent = 0;
          if (dcCapitalRule) {
            discountPercent = await this.reductionRatesService.getReductionPercent(
              companyId,
              'OPTIONAL_DOMMAGES_COLLISIONS',
              conventionId,
              capital,
              'DC_CAPITAL' as ReductionMetric,
              FormulaType.DOMMAGES_COLLISIONS,
              usageId,
            );
          } else if (marketValueRule) {
            discountPercent = await this.reductionRatesService.getReductionPercent(
              companyId,
              'OPTIONAL_DOMMAGES_COLLISIONS',
              conventionId,
              vv,
              'MARKET_VALUE' as ReductionMetric,
              FormulaType.DOMMAGES_COLLISIONS,
              usageId,
            );
          }

          if (discountPercent > 0) {
            const originalPrime = prime;
            prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
            reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
          }
        }
      }

      return {
        guaranteeCode: 'DOMMAGES_COLLISIONS',
        guaranteeId,
        capital,
        prime,
        reductionInfo,
      };
    }

    private async calculateBG(
      companyId: string,
      vehicle: VehicleData,
      isTousRisques: boolean,
      selectedCapital?: Decimal,
      conventionId?: string,
      isBGExplicitlySelected?: boolean,
    ): Promise<{
      guaranteeCode: string;
      guaranteeId: string;
      capital: Decimal;
      prime: Decimal;
      reductionInfo?: { originalPrime: number; discountPercent: number; finalPrime: number } | null;
    } | null> {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_BRIS_GLACES', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Bris de Glaces (OPTIONAL_BRIS_GLACES)');
      }

      // If BG is explicitly selected by user but no capital provided → ERROR (user mistake)
      if (isBGExplicitlySelected && (!selectedCapital || selectedCapital.eq(0))) {
        throw new BadRequestException(
          'Bris de Glaces (BG) est sélectionné mais aucun capital n\'a été choisi. Veuillez sélectionner un capital BG (1000 / 2000 / 3000 DT).',
        );
      }

      // If BG not selected or capital is 0, skip it gracefully
      if (!selectedCapital || selectedCapital.eq(0)) {
        return null;
      }

      const capital = selectedCapital;

      if (isTousRisques) {
        return {
          guaranteeCode: 'BG',
          guaranteeId: guarantee.id,
          capital,
          prime: new Decimal(0),  // FREE for Tous Risques
          reductionInfo: null,
        };
      }

      const conventionScope = conventionId ? { conventionId } : { conventionId: null };

      // Find rule based on CAPITAL range
      let rule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          ...conventionScope,
          AND: [
            {
              OR: [
                { minCapital: null },
                { minCapital: { lte: capital } },
              ],
            },
            {
              OR: [
                { maxCapital: null },
                { maxCapital: { gte: capital } },
              ],
            },
          ],
        },
        orderBy: { minCapital: 'desc' },  // Get most specific range
      });

      if (!rule && conventionId) {
        rule = await this.prisma.pricingRule.findFirst({
          where: {
            companyId,
            guaranteeId: guarantee.id,
            isActive: true,
            conventionId: null,
            AND: [
              {
                OR: [
                  { minCapital: null },
                  { minCapital: { lte: capital } },
                ],
              },
              {
                OR: [
                  { maxCapital: null },
                  { maxCapital: { gte: capital } },
                ],
              },
            ],
          },
          orderBy: { minCapital: 'desc' },
        });
      }

      if (!rule || rule.ratePercentage === null) {
        throw new BadRequestException(`BG pricing rule not found for capital ${capital} DT`);
      }

      // FORMULA: capital * ratePercentage * (1 - discount)
      let prime = capital.mul(rule.ratePercentage);
      
      if (rule.reductionRate && rule.reductionRate.gt(0)) {
        const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
        prime = prime.mul(multiplier);
      }

      // Apply convention reduction if exists
      let reductionInfo = null;
      if (conventionId) {
        const discountPercent = await this.reductionRatesService.getReductionPercent(
          companyId,
          'OPTIONAL_BRIS_GLACES',
          conventionId,
          capital,
          'DC_CAPITAL' as ReductionMetric,  // Use DC_CAPITAL metric for BG capital
        );
        if (discountPercent > 0) {
          const originalPrime = prime;
          prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
          reductionInfo = { originalPrime: originalPrime.toNumber(), discountPercent, finalPrime: prime.toNumber() };
        }
      }

      return {
        guaranteeCode: 'BG',
        guaranteeId: guarantee.id,
        capital,
        prime,
        reductionInfo,
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

    /**
     * Check guarantee availability status using the new configurable system
     * Returns: { isAvailable: boolean, isFree: boolean, isNotCovered: boolean }
     */
    private async checkGuaranteeAvailability(
      companyId: string,
      systemRole: string,
      formulaType: FormulaType,
      franchiseRate?: number,
    ): Promise<{ isAvailable: boolean; isFree: boolean; useDefault: boolean; isNotCovered: boolean }> {
      // Get guarantee by systemRole
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: systemRole as any, isActive: true } 
      });
      if (!guarantee) {
        return { isAvailable: false, isFree: false, useDefault: false, isNotCovered: false };
      }

      // Resolve availability status with franchise rate for BG
      const availability = systemRole === 'OPTIONAL_BRIS_GLACES' && franchiseRate !== undefined
        ? await this.guaranteeAvailabilityService.resolveAvailabilityWithFranchise(companyId, guarantee.id, formulaType, franchiseRate)
        : await this.guaranteeAvailabilityService.resolveAvailability(companyId, guarantee.id, formulaType);

      // Interpret status
      switch (availability.status) {
        case GuaranteeAvailabilityStatus.HIDDEN:
          // HIDDEN = Completely hidden from UI and quotes
          return { isAvailable: false, isFree: false, useDefault: false, isNotCovered: false };
        case GuaranteeAvailabilityStatus.NON_ACCORDEE:
          // NON_ACCORDEE = Show in quote/PDF but mark as "NOT COVERED"
          return { isAvailable: true, isFree: false, useDefault: false, isNotCovered: true };
        case GuaranteeAvailabilityStatus.GRATUIT:
          // GRATUIT = Available and free
          return { isAvailable: true, isFree: true, useDefault: false, isNotCovered: false };
        case GuaranteeAvailabilityStatus.DEFAULT:
        default:
          // DEFAULT = Use existing logic (backward compatible)
          return { isAvailable: true, isFree: false, useDefault: true, isNotCovered: false };
      }
    }

    private async calculateINCENDIE_EMEUTES(companyId: string, vehicle: VehicleData, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_INCENDIE_EMEUTES', isActive: true } 
      });
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
        isNotCovered: false,
      };
    }

    private async calculateCATNAT(companyId: string, vehicle: VehicleData, formulaType: FormulaType, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_CATASTROPHES_NATURELLES', isActive: true } 
      });
      if (!guarantee) {
        console.log('❌ CATNAT: Guarantee not found');
        return null;
      }

      // ✅ REMOVED FORMULA RESTRICTION - CATNAT can now be available for any formula (STANDARD, TOUS_RISQUES_0, etc.)
      // Availability is determined by:
      // 1. Guarantee availability config (checkGuaranteeAvailability)
      // 2. Pricing rule existence for the company/formula

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
        isNotCovered: false,
      };
    }

    private async calculateDOMMAGES_EMEUTES(companyId: string, vehicle: VehicleData, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_DOMMAGES_EMEUTES', isActive: true } 
      });
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
        isNotCovered: false,
      };
    }

    private async calculateDEFENSE_RECOURS(companyId: string, formulaType: FormulaType, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_DEFENSE_RECOURS', isActive: true } 
      });
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

    private async calculateASSURANCE_CONDUCTEUR(companyId: string, selectedCapital?: Decimal, conventionId?: string) {
      const guarantee = await this.prisma.guarantee.findFirst({ 
        where: { systemRole: 'OPTIONAL_ASSURANCE_CONDUCTEUR', isActive: true } 
      });
      if (!guarantee) {
        throw new BadRequestException('No guarantee configured for Assurance Conducteur (OPTIONAL_ASSURANCE_CONDUCTEUR)');
      }

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
        guaranteeCode: 'ASSURANCE_CONDUCTEUR',
        guaranteeId: guarantee.id,
        capital: new Decimal(matchedRule.minCapital),
        prime: new Decimal(matchedRule.fixedPremium),
      };
    }
  }
