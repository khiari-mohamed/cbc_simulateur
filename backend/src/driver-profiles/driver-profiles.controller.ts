import { Controller, Get, Post, Put, Body, UseGuards, Request, ConflictException } from '@nestjs/common';
import { DriverProfilesService } from './driver-profiles.service';
import { CreateDriverProfileDto } from './create-driver-profile.dto';
import { UpdateDriverProfileDto } from './update-driver-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('driver-profiles')
@UseGuards(JwtAuthGuard)
export class DriverProfilesController {
  constructor(private driverProfilesService: DriverProfilesService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateDriverProfileDto) {
    const existing = await this.driverProfilesService.findByUserId(req.user.id);
    if (existing) {
      throw new ConflictException('Driver profile already exists');
    }
    return this.driverProfilesService.create(req.user.id, {
      birthDate: new Date(dto.birthDate),
      licenseDate: new Date(dto.licenseDate),
      experienceYears: dto.experienceYears,
    });
  }

  @Get('me')
  findMine(@Request() req: any) {
    return this.driverProfilesService.findByUserId(req.user.id);
  }

  @Put()
  update(@Request() req: any, @Body() dto: UpdateDriverProfileDto) {
    return this.driverProfilesService.update(req.user.id, dto);
  }
}
