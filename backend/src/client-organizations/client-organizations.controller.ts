import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ClientOrganizationsService } from './client-organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('client-organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class ClientOrganizationsController {
  constructor(private service: ClientOrganizationsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: { name: string; code: string; joinKey: string }, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: { name?: string; code?: string }, @Request() req: any) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.service.deactivate(id, req.user.id);
  }
}
