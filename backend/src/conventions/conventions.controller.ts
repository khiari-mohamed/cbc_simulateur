import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConventionsService } from './conventions.service';
import { CreateConventionDto } from './create-convention.dto';
import { UpdateConventionDto } from './update-convention.dto';
import { ShareConventionDto } from './share-convention.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('conventions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConventionsController {
  constructor(private conventionsService: ConventionsService) {}

  @Post()
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateConventionDto) {
    return this.conventionsService.create(dto);
  }

  @Get('my')
  getMyConventions(@Request() req: any) {
    return this.conventionsService.findByUser(req.user.id);
  }

  @Get()
  findAll() {
    return this.conventionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conventionsService.findOne(id);
  }

  @Get(':id/shared-organizations')
  @Roles(Role.ADMINISTRATEUR_ARS)
  getSharedOrganizations(@Param('id') id: string) {
    return this.conventionsService.getSharedOrganizations(id);
  }

  @Post(':id/share')
  @Roles(Role.ADMINISTRATEUR_ARS)
  shareWithOrganizations(
    @Param('id') id: string,
    @Body() dto: ShareConventionDto,
    @Request() req: any,
  ) {
    return this.conventionsService.shareConventionWithOrganizations(
      id,
      dto.organizationIds,
      req.user.id,
    );
  }

  @Delete(':id/share/:orgId')
  @Roles(Role.ADMINISTRATEUR_ARS)
  removeSharedOrganization(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Request() req: any,
  ) {
    return this.conventionsService.removeOrganizationFromConvention(
      id,
      orgId,
      req.user.id,
    );
  }

  @Put(':id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(@Param('id') id: string, @Body() dto: UpdateConventionDto) {
    return this.conventionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  remove(@Param('id') id: string) {
    return this.conventionsService.remove(id);
  }
}
