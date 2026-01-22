import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './create-vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Get(':id/eligibility')
  async checkEligibility(@Param('id') id: string) {
    const vehicle = await this.vehiclesService.findById(id);
    const age = this.vehiclesService.calculateVehicleAge(vehicle.firstCirculationDate);
    
    return {
      vehicleAge: age,
      eligibleForTousRisques: this.vehiclesService.isEligibleForTousRisques(vehicle.firstCirculationDate),
      eligibleForDommagesCollision: this.vehiclesService.isEligibleForDommagesCollision(vehicle.firstCirculationDate),
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.vehiclesService.update(id, data);
  }
}
