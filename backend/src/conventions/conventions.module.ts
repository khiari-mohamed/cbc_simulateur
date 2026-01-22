import { Module } from '@nestjs/common';
import { ConventionsService } from './conventions.service';
import { ConventionsController } from './conventions.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [ConventionsService],
  controllers: [ConventionsController],
  exports: [ConventionsService],
})
export class ConventionsModule {}
