import { Module } from '@nestjs/common';
import { DriverProfilesService } from './driver-profiles.service';
import { DriverProfilesController } from './driver-profiles.controller';

@Module({
  providers: [DriverProfilesService],
  controllers: [DriverProfilesController],
  exports: [DriverProfilesService],
})
export class DriverProfilesModule {}
