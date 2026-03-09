import { Injectable } from '@nestjs/common';
import type { Database } from '@repo/types';
import type { AuthUser } from '../../auth';
import type { CreateOrderDto } from '../dto/order.dto';

/**
 * Order Factory - Factory Method Pattern
 *
 * Encapsulates order creation logic:
 * - Generate order codes
 * - Build order objects
 * - Handle order-specific business rules
 */
@Injectable()
export class OrderFactory {
  /**
   * Create order data object for database insertion
   */
  createOrderData(
    dto: CreateOrderDto,
    user: AuthUser,
  ): Database['public']['Tables']['orders']['Insert'] {
    const orderCode = this.generateOrderCode();

    return {
      store_id: dto.storeId,
      order_code: orderCode,
      status: 'pending',
      notes: dto.notes,
      created_by: user.id,
      total_amount: 0, // Will be calculated after items are added
    };
  }

  /**
   * Generate unique order code
   * Format: ORD-YYYYMMDD-XXXXX
   */
  private generateOrderCode(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-5);
    return `ORD-${date}-${timestamp}`;
  }
}
