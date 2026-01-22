import { Module } from '@nestjs/common';
import { GuaranteesService } from './guarantees.service';
import { GuaranteesController } from './guarantees.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [GuaranteesService],
  controllers: [GuaranteesController],
  exports: [GuaranteesService],
})
export class GuaranteesModule {}
