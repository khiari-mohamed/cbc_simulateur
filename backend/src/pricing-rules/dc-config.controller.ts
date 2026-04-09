import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DcConfigService } from './dc-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dc-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DcConfigController {
  constructor(private dcConfigService: DcConfigService) {}

  // DC Config endpoints - READ endpoints are public for clients
  @Get()
  findAllConfigs(@Query('companyId') companyId?: string, @Query('usageId') usageId?: string) {
    return this.dcConfigService.findAll(companyId, usageId);
  }

  @Get(':id')
  findConfigById(@Param('id') id: string) {
    return this.dcConfigService.findById(id);
  }

  // WRITE endpoints require ADMIN role
  @Roles(Role.ADMINISTRATEUR_ARS)
  @Post()
  createConfig(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.create(data, req.user.id);
  }

  @Roles(Role.ADMINISTRATEUR_ARS)
  @Patch(':id')
  updateConfig(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.dcConfigService.update(id, data, req.user.id);
  }

  @Roles(Role.ADMINISTRATEUR_ARS)
  @Delete(':id')
  deactivateConfig(@Param('id') id: string, @Request() req: any) {
    return this.dcConfigService.deactivate(id, req.user.id);
  }

  // Capital Tiers endpoints
  @Get('capital-tiers/:companyId/:usageId')
  findCapitalTiers(@Param('companyId') companyId: string, @Param('usageId') usageId: string) {
    return this.dcConfigService.findCapitalTiers(companyId, usageId);
  }

  @Post('capital-tiers')
  createCapitalTier(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.createCapitalTier(data, req.user.id);
  }

  @Patch('capital-tiers/:id')
  updateCapitalTier(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.dcConfigService.updateCapitalTier(id, data, req.user.id);
  }

  @Delete('capital-tiers/:id')
  deleteCapitalTier(@Param('id') id: string, @Request() req: any) {
    return this.dcConfigService.deleteCapitalTier(id, req.user.id);
  }

  // Progressive Tiers endpoints
  @Get('progressive-tiers/:companyId/:usageId')
  findProgressiveTiers(@Param('companyId') companyId: string, @Param('usageId') usageId: string) {
    return this.dcConfigService.findProgressiveTiers(companyId, usageId);
  }

  @Post('progressive-tiers')
  createProgressiveTier(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.createProgressiveTier(data, req.user.id);
  }

  @Patch('progressive-tiers/:id')
  updateProgressiveTier(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.dcConfigService.updateProgressiveTier(id, data, req.user.id);
  }

  @Delete('progressive-tiers/:id')
  deleteProgressiveTier(@Param('id') id: string, @Request() req: any) {
    return this.dcConfigService.deleteProgressiveTier(id, req.user.id);
  }

  // Matrix VV Ranges endpoints
  @Get('matrix-vv-ranges/:companyId/:usageId')
  findMatrixVvRanges(@Param('companyId') companyId: string, @Param('usageId') usageId: string) {
    return this.dcConfigService.findMatrixVvRanges(companyId, usageId);
  }

  @Post('matrix-vv-ranges')
  createMatrixVvRange(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.createMatrixVvRange(data, req.user.id);
  }

  @Patch('matrix-vv-ranges/:id')
  updateMatrixVvRange(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.dcConfigService.updateMatrixVvRange(id, data, req.user.id);
  }

  @Delete('matrix-vv-ranges/:id')
  deleteMatrixVvRange(@Param('id') id: string, @Request() req: any) {
    return this.dcConfigService.deleteMatrixVvRange(id, req.user.id);
  }

  // Matrix Capitals endpoints
  @Get('matrix-capitals/:companyId/:usageId')
  findMatrixCapitals(@Param('companyId') companyId: string, @Param('usageId') usageId: string) {
    return this.dcConfigService.findMatrixCapitals(companyId, usageId);
  }

  @Post('matrix-capitals')
  createMatrixCapital(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.createMatrixCapital(data, req.user.id);
  }

  @Patch('matrix-capitals/:id')
  updateMatrixCapital(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.dcConfigService.updateMatrixCapital(id, data, req.user.id);
  }

  @Delete('matrix-capitals/:id')
  deleteMatrixCapital(@Param('id') id: string, @Request() req: any) {
    return this.dcConfigService.deleteMatrixCapital(id, req.user.id);
  }

  // Matrix Prices endpoints
  @Get('matrix-prices/:companyId/:usageId')
  findMatrixPrices(@Param('companyId') companyId: string, @Param('usageId') usageId: string) {
    return this.dcConfigService.findMatrixPrices(companyId, usageId);
  }

  @Post('matrix-prices')
  upsertMatrixPrice(@Body() data: any, @Request() req: any) {
    return this.dcConfigService.upsertMatrixPrice(data, req.user.id);
  }
}
