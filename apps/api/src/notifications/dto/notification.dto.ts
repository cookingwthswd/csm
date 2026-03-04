import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType as NotificationTypeEnum,
  type NotificationType,
  type NotificationSettings,
  type UpdateNotificationSettingsDto as UpdateNotificationSettingsModel,
} from '@repo/types';

export class NotificationDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NotificationTypeEnum.options })
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

export class NotificationSettingsDto implements NotificationSettings {
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

export class UpdateNotificationSettingsRequestDto implements UpdateNotificationSettingsModel {
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
