import { Module } from '@nestjs/common';
import { UsageFeeConfigService } from './usage-fee-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsageFeeConfigService],
  exports: [UsageFeeConfigService],
})
export class UsageFeeConfigModule {}
