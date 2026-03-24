import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConventionReductionRulesService } from './convention-reduction-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, FormulaType, ReductionMetric } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

// Properly typed request extending Express Request
interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

// DTOs with proper types
interface CreateReductionRuleDto {
  conventionId: string;
  companyId?: string | null;
  guaranteeId: string;
  formulaType?: FormulaType | null;
  usageId?: string | null;
  metric: ReductionMetric;
  minValue?: number | null;
  maxValue?: number | null;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  discountPercent: number;
  priority?: number;
  validFrom?: Date;
  validTo?: Date | null;
}

interface UpdateReductionRuleDto {
  companyId?: string | null;
  guaranteeId?: string;
  formulaType?: FormulaType | null;
  usageId?: string | null;
  metric?: ReductionMetric;
  minValue?: number | null;
  maxValue?: number | null;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  discountPercent?: number;
  priority?: number;
  validTo?: Date | null;
}

@Controller('convention-reduction-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class ConventionReductionRulesController {
  constructor(private readonly service: ConventionReductionRulesService) {}

  @Get('convention/:conventionId')
  findByConvention(@Param('conventionId') conventionId: string) {
    return this.service.findByConvention(conventionId);
  }

  @Post()
  create(
    @Body() dto: CreateReductionRuleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReductionRuleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.service.deactivate(id, req.user.id);
  }
}
