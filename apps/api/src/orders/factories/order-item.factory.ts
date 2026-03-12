import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Database } from '@repo/types';
import type { CreateOrderItemDto } from '../dto/order.dto';

/**
 * Order Item Factory - Factory Method Pattern
 *
 * Encapsulates order item creation logic:
 * - Build order item objects
 * - Calculate line totals
 * - Validate pricing
 */
@Injectable()
export class OrderItemFactory {
  /**
   * Create order items with pricing
   *
   * @param orderId - The order ID these items belong to
   * @param items - Item DTOs from request
   * @param priceMap - Map of item IDs to current prices
   * @returns { orderItems, totalAmount }
   */
  createOrderItems(
    orderId: number,
    items: CreateOrderItemDto[],
    priceMap: Map<number, number>,
  ): {
    orderItems: Database['public']['Tables']['order_items']['Insert'][];
    totalAmount: number;
  } {
    let totalAmount = 0;

    const orderItems = items.map((item) => {
      const unitPrice = priceMap.get(item.itemId);

      if (unitPrice == null) {
        throw new InternalServerErrorException(
          `Price not found for item ${item.itemId}`,
        );
      }

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      return this.createOrderItem(orderId, item, unitPrice);
    });

    return { orderItems, totalAmount };
  }

  /**
   * Create single order item data object
   */
  private createOrderItem(
    orderId: number,
    item: CreateOrderItemDto,
    unitPrice: number,
  ): Database['public']['Tables']['order_items']['Insert'] {
    return {
      order_id: orderId,
      item_id: item.itemId,
      notes: item.notes,
      quantity_ordered: item.quantity,
      unit_price: unitPrice,
    };
  }
}
