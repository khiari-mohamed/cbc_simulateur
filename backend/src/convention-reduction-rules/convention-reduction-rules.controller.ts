import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConventionReductionRulesService } from './convention-reduction-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, FormulaType, UsageType, ReductionMetric } from '@prisma/client';

@Controller('convention-reduction-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class ConventionReductionRulesController {
  constructor(private service: ConventionReductionRulesService) {}

  @Get('convention/:conventionId')
  findByConvention(@Param('conventionId') conventionId: string) {
    return this.service.findByConvention(conventionId);
  }

  @Post()
  create(
    @Body()
    dto: {
      conventionId: string;
      companyId?: string;
      guaranteeId: string;
      formulaType?: FormulaType;
      usageType?: UsageType;
      metric: ReductionMetric;
      minValue?: number;
      maxValue?: number;
      minInclusive?: boolean;
      maxInclusive?: boolean;
      discountPercent: number;
      priority?: number;
      validFrom?: Date;
      validTo?: Date;
    },
    @Request() req: any,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      minValue?: number;
      maxValue?: number;
      minInclusive?: boolean;
      maxInclusive?: boolean;
      discountPercent?: number;
      priority?: number;
      validTo?: Date;
    },
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.service.deactivate(id, req.user.id);
  }
}
