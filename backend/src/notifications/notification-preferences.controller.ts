import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  frequency: 'IMMEDIATE' | 'DAILY_DIGEST';
  categories: {
    quoteStatus: boolean;
    documentRequests: boolean;
    paymentReminders: boolean;
    promotionalOffers: boolean;
    systemAnnouncements: boolean;
  };
}

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getPreferences(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true,
        // Add notification preferences fields to user model if needed
      },
    });

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      emailNotifications: true,
      inAppNotifications: true,
      frequency: 'IMMEDIATE',
      categories: {
        quoteStatus: true,
        documentRequests: true,
        paymentReminders: true,
        promotionalOffers: false,
        systemAnnouncements: true,
      },
    };

    return defaultPreferences;
  }

  @Post()
  async updatePreferences(
    @Request() req: any,
    @Body() preferences: NotificationPreferences,
  ) {
    // In a real implementation, you would store these in the database
    // For now, we'll just return success
    return { success: true, preferences };
  }
}