import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymeeService } from './paymee.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditModule],
  controllers: [PaymentsController],
  providers: [PaymeeService],
  exports: [PaymeeService],
})
export class PaymentsModule {}
