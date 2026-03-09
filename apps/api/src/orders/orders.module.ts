import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderFactory, OrderItemFactory } from './factories';

/**
 * Orders Module - Encapsulation Unit
 *
 * Factory Method Pattern:
 * - OrderFactory: Handles order creation logic
 * - OrderItemFactory: Handles order item creation logic
 */
@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderFactory, OrderItemFactory],
  exports: [OrdersService],
})
export class OrdersModule {}
