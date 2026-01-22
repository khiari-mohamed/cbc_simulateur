import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConventionsService } from './conventions.service';
import { CreateConventionDto } from './create-convention.dto';
import { UpdateConventionDto } from './update-convention.dto';
import { AssignConventionDto } from './assign-convention.dto';
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

  @Get(':id/users')
  @Roles(Role.ADMINISTRATEUR_ARS)
  getUsers(@Param('id') id: string) {
    return this.conventionsService.getUsers(id);
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

  @Post('assign')
  @Roles(Role.ADMINISTRATEUR_ARS)
  assign(@Body() dto: AssignConventionDto) {
    return this.conventionsService.assignUser(dto.userId, dto.conventionId);
  }

  @Delete('assign/:userId/:conventionId')
  @Roles(Role.ADMINISTRATEUR_ARS)
  unassign(@Param('userId') userId: string, @Param('conventionId') conventionId: string) {
    return this.conventionsService.unassignUser(userId, conventionId);
  }
}
