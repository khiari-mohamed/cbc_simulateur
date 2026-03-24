import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { GuaranteeBundlingsService } from './guarantee-bundlings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, FormulaType } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

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

@Controller('guarantee-bundlings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class GuaranteeBundlingsController {
  constructor(private readonly service: GuaranteeBundlingsService) {}

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Get('company/:companyId')
  findByCompany(@Param('companyId') companyId: string) {
    return this.service.findByCompany(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBundlingDto, @Request() req: RequestWithUser) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBundlingDto, @Request() req: RequestWithUser) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.service.delete(id, req.user.id);
  }

  @Get('check/:companyId/:parentGuaranteeId')
  checkBundling(
    @Param('companyId') companyId: string,
    @Param('parentGuaranteeId') parentGuaranteeId: string,
    @Query('formulaType') formulaType?: FormulaType,
  ) {
    return this.service.getIncludedGuarantees(companyId, parentGuaranteeId, formulaType);
  }
}
