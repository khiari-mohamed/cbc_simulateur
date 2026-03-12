import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { SeedService } from './seed.service';

@Controller('seed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class SeedController {
  constructor(private seedService: SeedService) {}

  @Post('minimal')
  async runMinimalSeed() {
    return this.seedService.runMinimalSeed();
  }

  @Post('full')
  async runFullSeed() {
    return this.seedService.runFullSeed();
  }

  @Post('wipe')
  async wipeDatabase() {
    return this.seedService.wipeDatabase();
  }
}
