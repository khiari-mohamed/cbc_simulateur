import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationAnalyticsController } from './notification-analytics.controller';
import { InternalNotificationsService } from './internal-notifications.service';
import { InternalNotificationsController } from './internal-notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    NotificationsController,
    NotificationPreferencesController,
    NotificationAnalyticsController,
    InternalNotificationsController,
  ],
  providers: [NotificationsService, InternalNotificationsService],
  exports: [NotificationsService, InternalNotificationsService],
})
export class NotificationsModule {}
