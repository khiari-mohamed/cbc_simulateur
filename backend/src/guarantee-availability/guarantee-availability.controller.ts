import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { GuaranteeAvailabilityService } from './guarantee-availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, FormulaType } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { CreateGuaranteeAvailabilityDto, UpdateGuaranteeAvailabilityDto } from './dto/guarantee-availability.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@Controller('guarantee-availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class GuaranteeAvailabilityController {
  constructor(private readonly service: GuaranteeAvailabilityService) {}

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Get('all-including-inactive')
  findAllIncludingInactive(@Query('companyId') companyId?: string) {
    return this.service.findAllIncludingInactive(companyId);
  }

  @Get('company/:companyId')
  findByCompany(@Param('companyId') companyId: string) {
    return this.service.findByCompany(companyId);
  }

  @Get('resolve')
  resolve(
    @Query('companyId') companyId: string,
    @Query('guaranteeId') guaranteeId: string,
    @Query('formulaType') formulaType?: FormulaType,
  ) {
    return this.service.resolveAvailability(companyId, guaranteeId, formulaType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGuaranteeAvailabilityDto, @Request() req: RequestWithUser) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuaranteeAvailabilityDto, @Request() req: RequestWithUser) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.service.delete(id, req.user.id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.service.deactivate(id, req.user.id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.service.activate(id, req.user.id);
  }

  @Post('bulk')
  createBulk(@Body() dtos: CreateGuaranteeAvailabilityDto[], @Request() req: RequestWithUser) {
    return this.service.createBulk(dtos, req.user.id);
  }

  @Post('resolve-bulk')
  @Roles(Role.CLIENT_ADHERENT, Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS) // Allow all authenticated users
  resolveBulk(
    @Body() dto: { companyId: string; guaranteeCodes: string[]; formulaType: FormulaType; franchiseRate?: number },
  ) {
    return this.service.resolveBulk(dto.companyId, dto.guaranteeCodes, dto.formulaType, dto.franchiseRate);
  }
}