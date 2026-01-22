import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, PdfModule, NotificationsModule],
  providers: [ContractsService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
