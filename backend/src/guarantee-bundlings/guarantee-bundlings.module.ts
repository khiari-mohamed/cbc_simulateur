import { Module } from '@nestjs/common';
import { GuaranteeBundlingsController } from './guarantee-bundlings.controller';
import { GuaranteeBundlingsService } from './guarantee-bundlings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GuaranteeBundlingsController],
  providers: [GuaranteeBundlingsService],
  exports: [GuaranteeBundlingsService],
})
export class GuaranteeBundlingsModule {}
