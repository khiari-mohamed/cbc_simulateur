import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Controller('notification-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class NotificationAnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  async getDashboard(@Query('period') period: string = '7d') {
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSent, deliveryStats, typeStats] = await Promise.all([
      this.prisma.notification.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.notification.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { status: true },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: { type: true },
      }),
    ]);

    const deliveryRate = deliveryStats.find(s => s.status === 'SENT')?._count?.status || 0;
    const failureRate = deliveryStats.find(s => s.status === 'FAILED')?._count?.status || 0;
    const successRate = totalSent > 0 ? (deliveryRate / totalSent) * 100 : 0;

    return {
      totalSent,
      successRate: Math.round(successRate * 100) / 100,
      deliveryStats,
      typeStats,
      period: `${days} days`,
    };
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit: number = 50) {
    return this.prisma.notification.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  @Get('failure-alerts')
  async getFailureAlerts() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentFailures = await this.prisma.notification.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: oneHourAgo },
      },
    });

    const alerts = [];
    if (recentFailures > 10) {
      alerts.push({
        type: 'HIGH_FAILURE_RATE',
        message: `${recentFailures} notifications failed in the last hour`,
        severity: 'HIGH',
      });
    }

    return { alerts, recentFailures };
  }
}