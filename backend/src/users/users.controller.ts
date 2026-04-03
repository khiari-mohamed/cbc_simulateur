import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './update-user.dto';
import { Toggle2FADto } from './toggle-2fa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get('me/conventions')
  getMyConventions(@Request() req: any) {
    return this.usersService.getUserConventions(req.user.id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }

  @Post(':id/conventions/:conventionId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  assignConvention(@Param('id') userId: string, @Param('conventionId') conventionId: string) {
    return this.usersService.assignConvention(userId, conventionId);
  }

  @Delete(':id/conventions/:conventionId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  removeConvention(@Param('id') userId: string, @Param('conventionId') conventionId: string) {
    return this.usersService.removeConvention(userId, conventionId);
  }

  @Post('toggle-2fa')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  toggle2FA(@Body() dto: Toggle2FADto) {
    return this.usersService.toggle2FA(dto.userId, dto.enabled);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
