import { Injectable } from '@nestjs/common';
import type { Notification } from '@repo/types';

/**
 * Email notification provider (stub).
 * Replace with Resend, SendGrid, or Supabase Edge Functions in production.
 */
@Injectable()
export class EmailProvider {
  async send(notification: Notification, email: string): Promise<void> {
    // TODO: integrate with email service (Resend, SendGrid, etc.)
    // eslint-disable-next-line no-console
    console.log(
      `[EmailProvider] Would send to ${email}: ${notification.title}`,
    );
  }
}
