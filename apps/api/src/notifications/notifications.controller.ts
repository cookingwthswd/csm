import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth';
import type { AuthUser } from '../auth';
import { NotificationsService } from './notifications.service';
import {
  NotificationDto,
  NotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from './dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  async list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.listUserNotifications(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, schema: { properties: { unreadCount: { type: 'number' } } } })
  async unreadCount(@CurrentUser() user: AuthUser) {
    const unreadCount = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.notificationsService.markAsRead(user.id, id);
    return { success: true };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.notificationsService.deleteNotification(user.id, id);
    return { success: true };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get current user notification settings' })
  @ApiResponse({ status: 200, type: NotificationSettingsDto })
  async getSettings(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getSettings(user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, type: NotificationSettingsDto })
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(user.id, dto);
  }
}

