import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AuditModule } from '../audit/audit.module';
import { UsageFeeConfigModule } from '../usage-fee-config/usage-fee-config.module';

@Module({
  imports: [AuditModule, UsageFeeConfigModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
