import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './create-company.dto';
import { UpdateCompanyDto } from './update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string, @Query('conventionId') conventionId?: string) {
    if (conventionId) {
      return this.companiesService.findByConvention(conventionId, includeInactive === 'true');
    }
    return this.companiesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateCompanyDto, @Request() req: any) {
    return this.companiesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Request() req: any) {
    return this.companiesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.companiesService.deactivate(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string, @Request() req: any) {
    return this.companiesService.reactivate(id, req.user.id);
  }
}
