import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBgCapitalLimitDto } from './dto/create-bg-capital-limit.dto';
import { UpdateBgCapitalLimitDto } from './dto/update-bg-capital-limit.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class BgCapitalLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.bgCapitalLimit.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { value: 'asc' },
    });
  }

  async findById(id: string) {
    const limit = await this.prisma.bgCapitalLimit.findUnique({ where: { id } });
    if (!limit) throw new NotFoundException('BG capital limit not found');
    return limit;
  }

  async create(dto: CreateBgCapitalLimitDto, userId: string) {
    try {
      const created = await this.prisma.bgCapitalLimit.create({
        data: {
          value: dto.value,
          label: dto.label,
          description: dto.description,
          isStandard: dto.isStandard ?? false,
        },
      });

      await this.auditService.log(
        userId,
        'BG_CAPITAL_LIMIT_CREATED',
        'BgCapitalLimit',
        created.id,
        null,
        {
          value: created.value,
          label: created.label,
          isStandard: created.isStandard,
        },
      );

      return created;
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('BG capital limit value already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateBgCapitalLimitDto, userId: string) {
    const existing = await this.findById(id);

    // Build update data conditionally
    const updateData: {
      value?: number;
      label?: string | null;
      description?: string | null;
      isStandard?: boolean;
      isActive?: boolean;
    } = {};

    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isStandard !== undefined) updateData.isStandard = dto.isStandard;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    try {
      const updated = await this.prisma.bgCapitalLimit.update({
        where: { id },
        data: updateData,
      });

      // Prepare detailed changes for audit
      const changes: Record<string, any> = {};
      if (dto.value !== undefined) {
        changes.value = { old: existing.value, new: updated.value };
      }
      if (dto.label !== undefined) {
        changes.label = { old: existing.label, new: updated.label };
      }
      if (dto.description !== undefined) {
        changes.description = { old: existing.description, new: updated.description };
      }
      if (dto.isStandard !== undefined) {
        changes.isStandard = { old: existing.isStandard, new: updated.isStandard };
      }
      if (dto.isActive !== undefined) {
        changes.isActive = { old: existing.isActive, new: updated.isActive };
      }

      await this.auditService.log(
        userId,
        'BG_CAPITAL_LIMIT_UPDATED',
        'BgCapitalLimit',
        id,
        existing,
        changes,
      );

      return updated;
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('BG capital limit value already exists');
      }
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const existing = await this.findById(id);

    try {
      const deleted = await this.prisma.bgCapitalLimit.delete({ where: { id } });

      await this.auditService.log(
        userId,
        'BG_CAPITAL_LIMIT_DELETED',
        'BgCapitalLimit',
        id,
        existing,
        null,
      );

      return deleted;
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException(
          `Cannot delete BG capital limit "${existing.label || existing.value}" because it is used in other records. Deactivate it instead.`,
        );
      }
      throw error;
    }
  }

  async deactivate(id: string, userId: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.bgCapitalLimit.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'BG_CAPITAL_LIMIT_DEACTIVATED',
      'BgCapitalLimit',
      id,
      { isActive: existing.isActive },
      { isActive: false },
    );

    return updated;
  }

  async reactivate(id: string, userId: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.bgCapitalLimit.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditService.log(
      userId,
      'BG_CAPITAL_LIMIT_REACTIVATED',
      'BgCapitalLimit',
      id,
      { isActive: existing.isActive },
      { isActive: true },
    );

    return updated;
  }
}
