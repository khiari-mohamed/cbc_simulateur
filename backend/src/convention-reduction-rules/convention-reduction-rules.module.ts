import { Module } from '@nestjs/common';
import { ConventionReductionRulesController } from './convention-reduction-rules.controller';
import { ConventionReductionRulesService } from './convention-reduction-rules.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ConventionReductionRulesController],
  providers: [ConventionReductionRulesService],
  exports: [ConventionReductionRulesService],
})
export class ConventionReductionRulesModule {}
