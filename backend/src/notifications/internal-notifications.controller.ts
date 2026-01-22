import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { InternalNotificationsService, InternalNotificationType } from './internal-notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('internal-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalNotificationsController {
  constructor(private internalNotificationsService: InternalNotificationsService) {}

  @Get()
  async getInternalNotifications(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.internalNotificationsService.getRoleNotifications(
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  @Get('unread-count')
  async getUnreadInternalCount(@Request() req: any) {
    return this.internalNotificationsService.getUnreadInternalCount(req.user.id);
  }

  @Post('urgent-review')
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS)
  async createUrgentReview(
    @Body() body: { quoteNumber: string; reason: string },
  ) {
    return this.internalNotificationsService.notifyUrgentReview(
      body.quoteNumber,
      body.reason,
    );
  }

  @Post('system-alert')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async createSystemAlert(
    @Body() body: { message: string; targetRole?: Role },
  ) {
    return this.internalNotificationsService.notifySystemAlert(
      body.message,
      body.targetRole,
    );
  }
}