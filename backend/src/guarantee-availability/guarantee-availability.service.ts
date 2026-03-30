import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GuaranteeAvailabilityStatus, FormulaType } from '@prisma/client';
import { CreateGuaranteeAvailabilityDto, UpdateGuaranteeAvailabilityDto } from './dto/guarantee-availability.dto';

@Injectable()
export class GuaranteeAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.guaranteeAvailability.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        isActive: true,
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: [{ company: { name: 'asc' } }, { guarantee: { code: 'asc' } }],
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.guaranteeAvailability.findMany({
      where: { 
        companyId,
        isActive: true,
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: { guarantee: { code: 'asc' } },
    });
  }

  async findOne(id: string) {
    const config = await this.prisma.guaranteeAvailability.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    if (!config) {
      throw new NotFoundException('Configuration de disponibilité non trouvée');
    }

    return config;
  }

  /**
   * Resolve guarantee availability status for a specific company/guarantee/formula combination
   * This is the CORE method used by pricing engine and frontend
   */
  async resolveAvailability(
    companyId: string,
    guaranteeId: string,
    formulaType?: FormulaType | null,
  ): Promise<{
    status: GuaranteeAvailabilityStatus;
    source: 'config' | 'fallback';
    configId?: string;
  }> {
    // Build OR conditions for formula matching
    const formulaConditions = [];
    
    // If formulaType is provided, look for exact match
    if (formulaType) {
      formulaConditions.push({ formulaType });
    }
    
    // Always include configs that apply to all formulas
    formulaConditions.push({ formulaType: null });

    // Fetch all matching configs
    const configs = await this.prisma.guaranteeAvailability.findMany({
      where: {
        companyId,
        guaranteeId,
        isActive: true,
        OR: formulaConditions,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (configs.length === 0) {
      // Fallback: DEFAULT (use pricing rules)
      return {
        status: GuaranteeAvailabilityStatus.DEFAULT,
        source: 'fallback',
      };
    }

    // Priority 1: Exact formula match (if formulaType provided)
    if (formulaType) {
      const exactMatch = configs.find(c => c.formulaType === formulaType);
      if (exactMatch) {
        return {
          status: exactMatch.status,
          source: 'config',
          configId: exactMatch.id,
        };
      }
    }

    // Priority 2: Global config (formulaType = null)
    const globalMatch = configs.find(c => c.formulaType === null);
    if (globalMatch) {
      return {
        status: globalMatch.status,
        source: 'config',
        configId: globalMatch.id,
      };
    }

    // Fallback: DEFAULT (should not reach here, but safety)
    return {
      status: GuaranteeAvailabilityStatus.DEFAULT,
      source: 'fallback',
    };
  }

  async create(data: CreateGuaranteeAvailabilityDto, userId: string) {
    // Validate company exists
    const company = await this.prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      throw new NotFoundException('Compagnie non trouvée');
    }

    // Validate guarantee exists
    const guarantee = await this.prisma.guarantee.findUnique({ where: { id: data.guaranteeId } });
    if (!guarantee) {
      throw new NotFoundException('Garantie non trouvée');
    }

    // Check for existing config
    const existing = await this.prisma.guaranteeAvailability.findFirst({
      where: {
        companyId: data.companyId,
        guaranteeId: data.guaranteeId,
        formulaType: data.formulaType || null,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException('Cette configuration existe déjà');
    }

    try {
      const config = await this.prisma.guaranteeAvailability.create({
        data: {
          companyId: data.companyId,
          guaranteeId: data.guaranteeId,
          formulaType: data.formulaType || null,
          status: data.status,
        },
        include: {
          company: { select: { id: true, name: true, code: true } },
          guarantee: { select: { id: true, code: true, nameFr: true } },
        },
      });

      await this.auditService.log(
        userId,
        'GUARANTEE_AVAILABILITY_CREATED',
        'GuaranteeAvailability',
        config.id,
        null,
        {
          companyId: data.companyId,
          guaranteeId: data.guaranteeId,
          formulaType: data.formulaType,
          status: data.status,
        },
      );

      return config;
    } catch (error) {
      // Handle race condition: unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException('Cette configuration existe déjà (créée par une autre requête)');
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateGuaranteeAvailabilityDto, userId: string) {
    const existing = await this.findOne(id);

    try {
      const updated = await this.prisma.guaranteeAvailability.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.formulaType !== undefined && { formulaType: data.formulaType || null }),
        },
        include: {
          company: { select: { id: true, name: true, code: true } },
          guarantee: { select: { id: true, code: true, nameFr: true } },
        },
      });

      await this.auditService.log(
        userId,
        'GUARANTEE_AVAILABILITY_UPDATED',
        'GuaranteeAvailability',
        id,
        { status: existing.status, isActive: existing.isActive, formulaType: existing.formulaType },
        { status: updated.status, isActive: updated.isActive, formulaType: updated.formulaType },
      );

      return updated;
    } catch (error) {
      // Handle Prisma unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException('Une configuration avec cette combinaison compagnie/garantie/formule existe déjà');
      }
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const config = await this.findOne(id);

    // Hard delete: permanently remove from database
    await this.prisma.guaranteeAvailability.delete({ where: { id } });

    await this.auditService.log(
      userId,
      'GUARANTEE_AVAILABILITY_HARD_DELETED',
      'GuaranteeAvailability',
      id,
      {
        companyId: config.companyId,
        guaranteeId: config.guaranteeId,
        status: config.status,
        isActive: config.isActive,
      },
      null,
    );

    return { message: 'Configuration supprimée définitivement' };
  }

  async deactivate(id: string, userId: string) {
    const config = await this.findOne(id);

    if (!config.isActive) {
      throw new ConflictException('Cette configuration est déjà désactivée');
    }

    const deactivated = await this.prisma.guaranteeAvailability.update({
      where: { id },
      data: { isActive: false },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_AVAILABILITY_DEACTIVATED',
      'GuaranteeAvailability',
      id,
      { isActive: true },
      { isActive: false },
    );

    return deactivated;
  }

  async activate(id: string, userId: string) {
    // Find config even if inactive
    const config = await this.prisma.guaranteeAvailability.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    if (!config) {
      throw new NotFoundException('Configuration de disponibilité non trouvée');
    }

    if (config.isActive) {
      throw new ConflictException('Cette configuration est déjà active');
    }

    const activated = await this.prisma.guaranteeAvailability.update({
      where: { id },
      data: { isActive: true },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_AVAILABILITY_ACTIVATED',
      'GuaranteeAvailability',
      id,
      { isActive: false },
      { isActive: true },
    );

    return activated;
  }

  async findAllIncludingInactive(companyId?: string) {
    return this.prisma.guaranteeAvailability.findMany({
      where: {
        ...(companyId && { companyId }),
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: [{ isActive: 'desc' }, { company: { name: 'asc' } }, { guarantee: { code: 'asc' } }],
    });
  }

  async createBulk(dataArray: CreateGuaranteeAvailabilityDto[], userId: string) {
    const results = {
      created: [] as any[],
      errors: [] as any[],
    };

    // Use transaction for better performance
    await this.prisma.$transaction(async (tx) => {
      for (const data of dataArray) {
        try {
          // Validate company exists
          const company = await tx.company.findUnique({ where: { id: data.companyId } });
          if (!company) {
            results.errors.push({
              data,
              error: 'Compagnie non trouvée',
            });
            continue;
          }

          // Validate guarantee exists
          const guarantee = await tx.guarantee.findUnique({ where: { id: data.guaranteeId } });
          if (!guarantee) {
            results.errors.push({
              data,
              error: 'Garantie non trouvée',
            });
            continue;
          }

          // Check for existing config
          const existing = await tx.guaranteeAvailability.findFirst({
            where: {
              companyId: data.companyId,
              guaranteeId: data.guaranteeId,
              formulaType: data.formulaType || null,
              isActive: true,
            },
          });

          if (existing) {
            results.errors.push({
              data,
              error: 'Cette configuration existe déjà',
            });
            continue;
          }

          // Create config
          const config = await tx.guaranteeAvailability.create({
            data: {
              companyId: data.companyId,
              guaranteeId: data.guaranteeId,
              formulaType: data.formulaType || null,
              status: data.status,
            },
            include: {
              company: { select: { id: true, name: true, code: true } },
              guarantee: { select: { id: true, code: true, nameFr: true } },
            },
          });

          results.created.push(config);
        } catch (error) {
          results.errors.push({
            data,
            error: error.message || 'Erreur inconnue',
          });
        }
      }
    });

    // Log audit AFTER transaction succeeds (outside transaction)
    for (const config of results.created) {
      try {
        await this.auditService.log(
          userId,
          'GUARANTEE_AVAILABILITY_CREATED',
          'GuaranteeAvailability',
          config.id,
          null,
          {
            companyId: config.companyId,
            guaranteeId: config.guaranteeId,
            formulaType: config.formulaType,
            status: config.status,
          },
        );
      } catch (auditError) {
        // Log audit error but don't fail the operation
        console.error('Audit log failed for config:', config.id, auditError);
      }
    }

    return results;
  }

  async resolveBulk(
    companyId: string,
    guaranteeCodes: string[],
    formulaType: FormulaType,
  ): Promise<Record<string, { isAvailable: boolean; isFree: boolean }>> {
    const result: Record<string, { isAvailable: boolean; isFree: boolean }> = {};

    // ✅ OPTIMIZATION: Fetch all guarantees in ONE query
    const guarantees = await this.prisma.guarantee.findMany({
      where: {
        code: { in: guaranteeCodes },
      },
      select: { id: true, code: true },
    });

    // Create map for O(1) lookup
    const guaranteeMap = new Map(guarantees.map(g => [g.code, g.id]));

    // ✅ OPTIMIZATION: Fetch all availability configs in ONE query
    const guaranteeIds = guarantees.map(g => g.id);
    const configs = await this.prisma.guaranteeAvailability.findMany({
      where: {
        companyId,
        guaranteeId: { in: guaranteeIds },
        isActive: true,
      },
      select: {
        guaranteeId: true,
        formulaType: true,
        status: true,
      },
    });

    // Create map for O(1) lookup: guaranteeId -> configs
    const configMap = new Map<string, typeof configs>();
    for (const config of configs) {
      if (!configMap.has(config.guaranteeId)) {
        configMap.set(config.guaranteeId, []);
      }
      configMap.get(config.guaranteeId)!.push(config);
    }

    // Process each guarantee code
    for (const code of guaranteeCodes) {
      const guaranteeId = guaranteeMap.get(code);
      
      if (!guaranteeId) {
        result[code] = { isAvailable: false, isFree: false };
        continue;
      }

      // Get configs for this guarantee
      const guaranteeConfigs = configMap.get(guaranteeId) || [];

      // Apply same priority logic as resolveAvailability
      let matchedConfig = null;

      // Priority 1: Exact formula match
      if (formulaType) {
        matchedConfig = guaranteeConfigs.find(c => c.formulaType === formulaType);
      }

      // Priority 2: Global config (formulaType = null)
      if (!matchedConfig) {
        matchedConfig = guaranteeConfigs.find(c => c.formulaType === null);
      }

      // Interpret status
      if (matchedConfig) {
        switch (matchedConfig.status) {
          case GuaranteeAvailabilityStatus.NON_ACCORDEE:
            result[code] = { isAvailable: false, isFree: false };
            break;
          case GuaranteeAvailabilityStatus.GRATUIT:
            result[code] = { isAvailable: true, isFree: true };
            break;
          case GuaranteeAvailabilityStatus.DEFAULT:
          default:
            result[code] = { isAvailable: true, isFree: false };
            break;
        }
      } else {
        // No config found -> DEFAULT
        result[code] = { isAvailable: true, isFree: false };
      }
    }

    return result;
  }
}