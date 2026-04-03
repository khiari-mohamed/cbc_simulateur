import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { UsageTypesService } from './usage-types.service';
import { CreateUsageTypeDto } from './dto/create-usage-type.dto';
import { UpdateUsageTypeDto } from './dto/update-usage-type.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@Controller('usage-types')
@UseGuards(JwtAuthGuard)
export class UsageTypesController {
  constructor(private readonly usageService: UsageTypesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.usageService.findAll(include);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usageService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateUsageTypeDto, @Request() req: RequestWithUser) {
    return this.usageService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsageTypeDto,
    @Request() req: RequestWithUser,
  ) {
    return this.usageService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usageService.deactivate(id, req.user.id);
  }

  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deletePermanent(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usageService.delete(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usageService.reactivate(id, req.user.id);
  }
}
