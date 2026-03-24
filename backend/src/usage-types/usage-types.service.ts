import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUsageTypeDto } from './dto/create-usage-type.dto';
import { UpdateUsageTypeDto } from './dto/update-usage-type.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsageTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.usage.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string) {
    const u = await this.prisma.usage.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('Usage not found');
    return u;
  }

  async create(dto: CreateUsageTypeDto, userId: string) {
    try {
      const created = await this.prisma.usage.create({
        data: {
          code: dto.code,
          nameFr: dto.nameFr,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
        },
      });

      await this.auditService.log(
        userId,
        'USAGE_CREATED',
        'Usage',
        created.id,
        null,
        {
          code: created.code,
          nameFr: created.nameFr,
          nameAr: created.nameAr,
          nameEn: created.nameEn,
        },
      );

      return created;
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Usage code already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUsageTypeDto, userId: string) {
    const existing = await this.findById(id);

    // Code is immutable - cannot be changed after creation
    if (dto.code && dto.code !== existing.code) {
      throw new BadRequestException('Usage code cannot be changed');
    }

    // Build update data conditionally - only include fields that are actually provided
    const updateData: {
      nameFr?: string;
      nameAr?: string | null;
      nameEn?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.nameFr !== undefined) updateData.nameFr = dto.nameFr;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    try {
      const updated = await this.prisma.usage.update({
        where: { id },
        data: updateData,
      });

      // Prepare detailed changes for audit
      const changes: Record<string, any> = {};
      if (dto.nameFr !== undefined) {
        changes.nameFr = { old: existing.nameFr, new: updated.nameFr };
      }
      if (dto.nameAr !== undefined) {
        changes.nameAr = { old: existing.nameAr, new: updated.nameAr };
      }
      if (dto.nameEn !== undefined) {
        changes.nameEn = { old: existing.nameEn, new: updated.nameEn };
      }
      if (dto.isActive !== undefined) {
        changes.isActive = { old: existing.isActive, new: updated.isActive };
      }

      await this.auditService.log(
        userId,
        'USAGE_UPDATED',
        'Usage',
        id,
        existing,
        changes,
      );

      return updated;
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Usage code already exists');
      }
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const existing = await this.findById(id);

    try {
      const deleted = await this.prisma.usage.delete({ where: { id } });

      await this.auditService.log(
        userId,
        'USAGE_DELETED',
        'Usage',
        id,
        existing,
        null,
      );

      return deleted;
    } catch (error: unknown) {
      // If foreign key constraint fails, it means the usage is referenced elsewhere
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException(
          `Cannot delete usage "${existing.nameFr}" because it is used in other records (pricing rules, configurations, simulations, etc.). Deactivate it instead.`,
        );
      }
      throw error;
    }
  }

  async deactivate(id: string, userId: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.usage.update({ where: { id }, data: { isActive: false } });
    await this.auditService.log(userId, 'USAGE_DEACTIVATED', 'Usage', id, { isActive: existing.isActive }, { isActive: false });
    return updated;
  }

  async reactivate(id: string, userId: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.usage.update({ where: { id }, data: { isActive: true } });
    await this.auditService.log(userId, 'USAGE_REACTIVATED', 'Usage', id, { isActive: existing.isActive }, { isActive: true });
    return updated;
  }
}
