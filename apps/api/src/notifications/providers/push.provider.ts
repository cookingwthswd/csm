import { Injectable } from '@nestjs/common';
import type { Notification } from '@repo/types';

/**
 * Push notification provider (stub).
 * Replace with FCM, OneSignal, or Web Push in production.
 */
@Injectable()
export class PushProvider {
  async send(notification: Notification, userId: string): Promise<void> {
    // TODO: integrate with push service (FCM, OneSignal, etc.)
    // eslint-disable-next-line no-console
    console.log(
      `[PushProvider] Would push to ${userId}: ${notification.title}`,
    );
  }
}
