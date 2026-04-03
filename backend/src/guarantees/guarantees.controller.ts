import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { GuaranteesService } from './guarantees.service';
import { CreateGuaranteeDto } from './create-guarantee.dto';
import { UpdateGuaranteeDto } from './update-guarantee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('guarantees')
@UseGuards(JwtAuthGuard)
export class GuaranteesController {
  constructor(private guaranteesService: GuaranteesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string, @Query('conventionId') conventionId?: string) {
    if (conventionId) {
      return this.guaranteesService.findByConvention(conventionId, includeInactive === 'true');
    }
    return this.guaranteesService.findAll(includeInactive === 'true');
  }

  @Get('required')
  getRequired() {
    return this.guaranteesService.getRequiredGuarantees();
  }

  @Get('optional')
  getOptional() {
    return this.guaranteesService.getOptionalGuarantees();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guaranteesService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateGuaranteeDto, @Request() req: any) {
    return this.guaranteesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(@Param('id') id: string, @Body() dto: UpdateGuaranteeDto, @Request() req: any) {
    return this.guaranteesService.update(id, dto, req.user.id);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.guaranteesService.deactivate(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string, @Request() req: any) {
    return this.guaranteesService.reactivate(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  delete(@Param('id') id: string, @Request() req: any) {
    return this.guaranteesService.delete(id, req.user.id);
  }
}
