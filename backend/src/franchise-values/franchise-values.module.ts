import { Module } from '@nestjs/common';
import { FranchiseValuesController } from './franchise-values.controller';
import { FranchiseValuesService } from './franchise-values.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [FranchiseValuesController],
  providers: [FranchiseValuesService],
  exports: [FranchiseValuesService],
})
export class FranchiseValuesModule {}