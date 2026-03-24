import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FranchiseValuesService } from './franchise-values.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { CreateFranchiseValueDto, UpdateFranchiseValueDto } from './dto/franchise-value.dto';

// Extend Express Request to include user
interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@Controller('franchise-values')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FranchiseValuesController {
  constructor(private readonly franchiseValuesService: FranchiseValuesService) {}

  @Get()
  async findAll() {
    return this.franchiseValuesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.franchiseValuesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRATEUR_ARS)
  async create(
    @Body() data: CreateFranchiseValueDto,
    @Request() req: RequestWithUser,
  ) {
    return this.franchiseValuesService.create(data, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateFranchiseValueDto,
    @Request() req: RequestWithUser,
  ) {
    return this.franchiseValuesService.update(id, data, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.franchiseValuesService.remove(id, req.user.id);
  }
}