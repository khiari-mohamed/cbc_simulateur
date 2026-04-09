import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaEligibilityRuleDto } from './dto/create-formula-eligibility-rule.dto';
import { UpdateFormulaEligibilityRuleDto } from './dto/update-formula-eligibility-rule.dto';
import { FormulaType } from '@prisma/client';

@Injectable()
export class FormulaEligibilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all eligibility rules with optional filters
   */
  async findAll(companyId?: string, usageId?: string, formulaType?: FormulaType) {
    return this.prisma.formulaEligibilityAgeRule.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(usageId && { usageId }),
        ...(formulaType && { formulaType }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        usage: {
          select: {
            id: true,
            code: true,
            nameFr: true,
            nameAr: true,
          },
        },
      },
      orderBy: [
        { company: { name: 'asc' } },
        { usage: { nameFr: 'asc' } },
        { formulaType: 'asc' },
      ],
    });
  }

  /**
   * Get a single rule by ID
   */
  async findOne(id: string) {
    const rule = await this.prisma.formulaEligibilityAgeRule.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        usage: {
          select: {
            id: true,
            code: true,
            nameFr: true,
            nameAr: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException(`Formula eligibility rule with ID ${id} not found`);
    }

    return rule;
  }

  /**
   * Create a new eligibility rule
   */
  async create(dto: CreateFormulaEligibilityRuleDto) {
    // Check if rule already exists for this combination
    const existing = await this.prisma.formulaEligibilityAgeRule.findUnique({
      where: {
        companyId_usageId_formulaType: {
          companyId: dto.companyId,
          usageId: dto.usageId,
          formulaType: dto.formulaType,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A rule already exists for this company, usage, and formula type combination`,
      );
    }

    return this.prisma.formulaEligibilityAgeRule.create({
      data: dto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        usage: {
          select: {
            id: true,
            code: true,
            nameFr: true,
            nameAr: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing rule
   */
  async update(id: string, dto: UpdateFormulaEligibilityRuleDto) {
    // Check if rule exists
    await this.findOne(id);

    // If updating the unique combination, check for conflicts
    if (dto.companyId || dto.usageId || dto.formulaType) {
      const currentRule = await this.prisma.formulaEligibilityAgeRule.findUnique({
        where: { id },
      });

      const newCompanyId = dto.companyId || currentRule!.companyId;
      const newUsageId = dto.usageId || currentRule!.usageId;
      const newFormulaType = dto.formulaType || currentRule!.formulaType;

      const existing = await this.prisma.formulaEligibilityAgeRule.findUnique({
        where: {
          companyId_usageId_formulaType: {
            companyId: newCompanyId,
            usageId: newUsageId,
            formulaType: newFormulaType,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A rule already exists for this company, usage, and formula type combination`,
        );
      }
    }

    return this.prisma.formulaEligibilityAgeRule.update({
      where: { id },
      data: dto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        usage: {
          select: {
            id: true,
            code: true,
            nameFr: true,
            nameAr: true,
          },
        },
      },
    });
  }

  /**
   * Delete a rule
   */
  async remove(id: string) {
    // Check if rule exists
    await this.findOne(id);

    return this.prisma.formulaEligibilityAgeRule.delete({
      where: { id },
    });
  }

  /**
   * Check if a formula is eligible based on vehicle age
   * Returns true if eligible, false if not
   */
  async checkEligibility(
    companyId: string,
    usageId: string,
    formulaType: FormulaType,
    vehicleAgeInYears: number,
  ): Promise<{ eligible: boolean; minAge?: number; maxAge?: number; reason?: string }> {
    const rule = await this.prisma.formulaEligibilityAgeRule.findFirst({
      where: {
        companyId,
        usageId,
        formulaType,
        isActive: true,
      },
    });

    // If no rule exists, formula is eligible (no restriction)
    if (!rule) {
      return { eligible: true };
    }

    // Check min age (if specified)
    if (rule.minAgeYears !== null && rule.minAgeYears !== undefined) {
      if (vehicleAgeInYears < rule.minAgeYears) {
        return {
          eligible: false,
          minAge: rule.minAgeYears,
          maxAge: rule.maxAgeYears || undefined,
          reason: `Le véhicule doit avoir au moins ${rule.minAgeYears} an(s) (âge actuel: ${vehicleAgeInYears} an(s))`,
        };
      }
    }

    // Check max age (if specified)
    if (rule.maxAgeYears !== null && rule.maxAgeYears !== undefined) {
      if (vehicleAgeInYears >= rule.maxAgeYears) {
        return {
          eligible: false,
          minAge: rule.minAgeYears || undefined,
          maxAge: rule.maxAgeYears,
          reason: `Le véhicule doit avoir moins de ${rule.maxAgeYears} an(s) (âge actuel: ${vehicleAgeInYears} an(s))`,
        };
      }
    }

    // If both min and max are specified, show range in success case
    if (rule.minAgeYears !== null && rule.maxAgeYears !== null) {
      return {
        eligible: true,
        minAge: rule.minAgeYears,
        maxAge: rule.maxAgeYears,
      };
    }

    // Only one bound specified
    return {
      eligible: true,
      minAge: rule.minAgeYears || undefined,
      maxAge: rule.maxAgeYears || undefined,
    };
  }

  /**
   * Get eligible formulas for a given vehicle age, company, and usage
   */
  async getEligibleFormulas(
    companyId: string,
    usageId: string,
    vehicleAgeInYears: number,
  ): Promise<FormulaType[]> {
    const allFormulas: FormulaType[] = ['STANDARD', 'TOUS_RISQUES_0', 'DOMMAGES_COLLISIONS'];

    // Fetch all active rules for this company/usage in one query
    const rules = await this.prisma.formulaEligibilityAgeRule.findMany({
      where: {
        companyId,
        usageId,
        isActive: true,
      },
    });

    // Filter formulas based on rules
    return allFormulas.filter((formula) => {
      const rule = rules.find((r) => r.formulaType === formula);
      if (!rule) return true; // No rule = no restriction = eligible
      
      // Check min age
      if (rule.minAgeYears !== null && rule.minAgeYears !== undefined) {
        if (vehicleAgeInYears < rule.minAgeYears) return false;
      }
      
      // Check max age
      if (rule.maxAgeYears !== null && rule.maxAgeYears !== undefined) {
        if (vehicleAgeInYears >= rule.maxAgeYears) return false;
      }
      
      return true;
    });
  }
}
