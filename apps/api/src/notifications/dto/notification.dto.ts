import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  type Notification as NotificationModel,
  type NotificationSettings as NotificationSettingsModel,
  type UpdateNotificationSettingsDto as UpdateNotificationSettingsModel,
} from '@repo/types';

export class NotificationDto implements NotificationModel {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NotificationType.options })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false, nullable: true })
  message!: string | null;

  @ApiProperty({ required: false, nullable: true, type: Object })
  data?: Record<string, any> | null;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: string;
}

export class NotificationSettingsDto implements NotificationSettingsModel {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  emailEnabled!: boolean;

  @ApiProperty()
  pushEnabled!: boolean;

  @ApiProperty()
  orderUpdates!: boolean;

  @ApiProperty()
  stockAlerts!: boolean;

  @ApiProperty()
  deliveryUpdates!: boolean;
}

export class UpdateNotificationSettingsDto implements UpdateNotificationSettingsModel {
  @ApiProperty({ required: false })
  emailEnabled?: boolean;

  @ApiProperty({ required: false })
  pushEnabled?: boolean;

  @ApiProperty({ required: false })
  orderUpdates?: boolean;

  @ApiProperty({ required: false })
  stockAlerts?: boolean;

  @ApiProperty({ required: false })
  deliveryUpdates?: boolean;
}

