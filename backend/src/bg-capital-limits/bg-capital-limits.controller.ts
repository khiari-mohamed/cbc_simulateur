import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { BgCapitalLimitsService } from './bg-capital-limits.service';
import { CreateBgCapitalLimitDto } from './dto/create-bg-capital-limit.dto';
import { UpdateBgCapitalLimitDto } from './dto/update-bg-capital-limit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@Controller('bg-capital-limits')
export class BgCapitalLimitsController {
  constructor(private readonly bgCapitalLimitsService: BgCapitalLimitsService) {}

  // Public endpoint - all authenticated users can view BG limits for quote generation
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.bgCapitalLimitsService.findAll(include);
  }

  // Admin-only endpoints below
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  findOne(@Param('id') id: string) {
    return this.bgCapitalLimitsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateBgCapitalLimitDto, @Request() req: RequestWithUser) {
    return this.bgCapitalLimitsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBgCapitalLimitDto,
    @Request() req: RequestWithUser,
  ) {
    return this.bgCapitalLimitsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deletePermanent(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.bgCapitalLimitsService.delete(id, req.user.id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.bgCapitalLimitsService.deactivate(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.bgCapitalLimitsService.reactivate(id, req.user.id);
  }
}
