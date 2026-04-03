import { Controller, Get, Post,Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DcCapitalTiersService } from './dc-capital-tiers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { CreateDcCapitalTierDto } from './dto/create-dc-capital-tier.dto';
import { UpdateDcCapitalTierDto } from './dto/update-dc-capital-tier.dto';

@Controller('dc-capital-tiers')
export class DcCapitalTiersController {
  constructor(private readonly dcCapitalTiersService: DcCapitalTiersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.dcCapitalTiersService.findAll();
  }

  @Get('by-company-usage')
  @UseGuards(JwtAuthGuard)
  findByCompanyAndUsage(
    @Query('companyId') companyId: string,
    @Query('usageId') usageId: string,
  ) {
    return this.dcCapitalTiersService.findByCompanyAndUsage(companyId, usageId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  findOne(@Param('id') id: string) {
    return this.dcCapitalTiersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() createDto: CreateDcCapitalTierDto) {
    return this.dcCapitalTiersService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(@Param('id') id: string, @Body() updateDto: UpdateDcCapitalTierDto) {
    return this.dcCapitalTiersService.update(id, updateDto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string) {
    return this.dcCapitalTiersService.deactivate(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string) {
    return this.dcCapitalTiersService.reactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  delete(@Param('id') id: string) {
    return this.dcCapitalTiersService.delete(id);
  }

  @Post('copy-to-companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  copyToCompanies(
    @Body() body: { sourceTierId: string; targetCompanyIds: string[] },
  ) {
    return this.dcCapitalTiersService.copyToCompanies(
      body.sourceTierId,
      body.targetCompanyIds,
    );
  }
}
