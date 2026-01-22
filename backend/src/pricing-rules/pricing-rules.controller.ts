import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { CreatePricingRuleDto } from './create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './update-pricing-rule.dto';
import { UpdateReductionRateDto } from './update-reduction-rate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('pricing-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class PricingRulesController {
  constructor(private pricingRulesService: PricingRulesService) {}

  @Get()
  findAll(
    @Query('companyId') companyId?: string,
    @Query('guaranteeId') guaranteeId?: string,
  ) {
    return this.pricingRulesService.findAll(companyId, guaranteeId);
  }

  @Get('optional-guarantees')
  getOptionalGuaranteesRules(@Query('companyId') companyId?: string) {
    return this.pricingRulesService.getOptionalGuaranteesRules(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricingRulesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePricingRuleDto, @Request() req: any) {
    return this.pricingRulesService.create(dto, req.user.id);
  }

  @Patch(':id/reduction-rate')
  updateReductionRate(@Param('id') id: string, @Body() dto: UpdateReductionRateDto, @Request() req: any) {
    return this.pricingRulesService.updateReductionRate(id, dto.reductionRate, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePricingRuleDto, @Request() req: any) {
    return this.pricingRulesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.pricingRulesService.deactivate(id, req.user.id);
  }
}
