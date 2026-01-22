import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [VehiclesModule, AuditModule],
  providers: [SimulationsService],
  controllers: [SimulationsController],
  exports: [SimulationsService],
})
export class SimulationsModule {}
