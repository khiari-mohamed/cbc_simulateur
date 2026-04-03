import { Module } from '@nestjs/common';
import { DcCapitalTiersController } from './dc-capital-tiers.controller';
import { DcCapitalTiersService } from './dc-capital-tiers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DcCapitalTiersController],
  providers: [DcCapitalTiersService],
  exports: [DcCapitalTiersService],
})
export class DcCapitalTiersModule {}
