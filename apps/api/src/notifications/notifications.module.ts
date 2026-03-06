import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailProvider, PushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
