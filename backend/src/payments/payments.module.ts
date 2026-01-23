import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { FlouciService } from './flouci.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditModule],
  controllers: [PaymentsController],
  providers: [FlouciService],
  exports: [FlouciService],
})
export class PaymentsModule {}
