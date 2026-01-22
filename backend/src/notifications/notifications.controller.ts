import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unreadOnly') unreadOnly: boolean = false,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
      page,
      limit,
      unreadOnly,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post(':id/mark-read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}