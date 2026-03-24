import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormulaType } from '@prisma/client';

interface CreateBundlingDto {
  companyId: string;
  parentGuaranteeId: string;
  includedGuaranteeId: string;
  formulaType?: FormulaType | null;
}

interface UpdateBundlingDto {
  formulaType?: FormulaType | null;
  isActive?: boolean;
}

@Injectable()
export class GuaranteeBundlingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.guaranteeBundling.findMany({
      where: companyId ? { companyId } : {},
      include: {
        company: { select: { id: true, name: true, code: true } },
        parentGuarantee: { select: { id: true, code: true, nameFr: true } },
        includedGuarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: [{ company: { name: 'asc' } }, { parentGuarantee: { code: 'asc' } }],
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.guaranteeBundling.findMany({
      where: { companyId },
      include: {
        company: { select: { id: true, name: true, code: true } },
        parentGuarantee: { select: { id: true, code: true, nameFr: true } },
        includedGuarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: { parentGuarantee: { code: 'asc' } },
    });
  }

  async findOne(id: string) {
    const bundling = await this.prisma.guaranteeBundling.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, code: true } },
        parentGuarantee: { select: { id: true, code: true, nameFr: true } },
        includedGuarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    if (!bundling) {
      throw new NotFoundException('Guarantee bundling not found');
    }

    return bundling;
  }

  async create(data: CreateBundlingDto, userId: string) {
    // Validate that parent and included guarantees are different
    if (data.parentGuaranteeId === data.includedGuaranteeId) {
      throw new BadRequestException('Une garantie ne peut pas être groupée avec elle-même');
    }

    // Check if company exists
    const company = await this.prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      throw new NotFoundException('Compagnie non trouvée');
    }

    // Check if parent guarantee exists
    const parentGuarantee = await this.prisma.guarantee.findUnique({ where: { id: data.parentGuaranteeId } });
    if (!parentGuarantee) {
      throw new NotFoundException('Garantie principale non trouvée');
    }

    // Check if included guarantee exists
    const includedGuarantee = await this.prisma.guarantee.findUnique({ where: { id: data.includedGuaranteeId } });
    if (!includedGuarantee) {
      throw new NotFoundException('Garantie incluse non trouvée');
    }

    // Check for existing bundling (same company, parent, included, formula)
    const existing = await this.prisma.guaranteeBundling.findFirst({
      where: {
        companyId: data.companyId,
        parentGuaranteeId: data.parentGuaranteeId,
        includedGuaranteeId: data.includedGuaranteeId,
        formulaType: data.formulaType || null,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException('Cette règle de groupement existe déjà');
    }

    const bundling = await this.prisma.guaranteeBundling.create({
      data: {
        companyId: data.companyId,
        parentGuaranteeId: data.parentGuaranteeId,
        includedGuaranteeId: data.includedGuaranteeId,
        formulaType: data.formulaType || null,
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        parentGuarantee: { select: { id: true, code: true, nameFr: true } },
        includedGuarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_BUNDLING_CREATED',
      'GuaranteeBundling',
      bundling.id,
      null,
      {
        companyId: data.companyId,
        parentGuaranteeId: data.parentGuaranteeId,
        includedGuaranteeId: data.includedGuaranteeId,
        formulaType: data.formulaType,
      },
    );

    return bundling;
  }

  async update(id: string, data: UpdateBundlingDto, userId: string) {
    const existing = await this.findOne(id);

    // Check for duplicate if formulaType is being changed
    if (data.formulaType !== undefined) {
      const newFormulaType = data.formulaType;
      const duplicate = await this.prisma.guaranteeBundling.findFirst({
        where: {
          companyId: existing.companyId,
          parentGuaranteeId: existing.parentGuaranteeId,
          includedGuaranteeId: existing.includedGuaranteeId,
          formulaType: newFormulaType,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        throw new ConflictException('Une règle de groupement identique existe déjà pour cette combinaison');
      }
    }

    const updated = await this.prisma.guaranteeBundling.update({
      where: { id },
      data: {
        formulaType: data.formulaType !== undefined ? data.formulaType : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        parentGuarantee: { select: { id: true, code: true, nameFr: true } },
        includedGuarantee: { select: { id: true, code: true, nameFr: true } },
      },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_BUNDLING_UPDATED',
      'GuaranteeBundling',
      id,
      { formulaType: existing.formulaType, isActive: existing.isActive },
      { formulaType: updated.formulaType, isActive: updated.isActive },
    );

    return updated;
  }

  async delete(id: string, userId: string) {
    const bundling = await this.findOne(id);

    await this.prisma.guaranteeBundling.delete({ where: { id } });

    await this.auditService.log(
      userId,
      'GUARANTEE_BUNDLING_DELETED',
      'GuaranteeBundling',
      id,
      {
        companyId: bundling.companyId,
        parentGuaranteeId: bundling.parentGuaranteeId,
        includedGuaranteeId: bundling.includedGuaranteeId,
      },
      null,
    );

    return { message: 'Règle de groupement supprimée' };
  }

  /**
   * Get all guarantees that are automatically included when selecting a parent guarantee
   * Used by pricing engine to determine bundled guarantees
   */
  async getIncludedGuarantees(
    companyId: string,
    parentGuaranteeId: string,
    formulaType?: FormulaType,
  ): Promise<string[]> {
    const bundlings = await this.prisma.guaranteeBundling.findMany({
      where: {
        companyId,
        parentGuaranteeId,
        isActive: true,
        OR: [
          { formulaType: null }, // Applies to all formulas
          { formulaType }, // Applies to specific formula
        ],
      },
      select: {
        includedGuaranteeId: true,
      },
    });

    return bundlings.map((b) => b.includedGuaranteeId);
  }

  /**
   * Check if a guarantee is bundled (included in another guarantee)
   * Used to hide/disable guarantees in UI
   */
  async isGuaranteeBundled(
    companyId: string,
    guaranteeId: string,
    formulaType?: FormulaType,
  ): Promise<boolean> {
    const count = await this.prisma.guaranteeBundling.count({
      where: {
        companyId,
        includedGuaranteeId: guaranteeId,
        isActive: true,
        OR: [
          { formulaType: null },
          { formulaType },
        ],
      },
    });

    return count > 0;
  }
}
