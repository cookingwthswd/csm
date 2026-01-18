import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO = Data Transfer Object
 * - Định nghĩa structure của data khi request/response
 * - Dùng decorators để validate + generate Swagger docs
 *
 * NGUYÊN TẮC:
 * - 1 DTO cho 1 action (CreateOrderDto, UpdateOrderDto, ...)
 * - Không dùng entity trực tiếp làm DTO (tách riêng để linh hoạt)
 */

// ═══════════════════════════════════════════════════════════
// ORDER STATUS ENUM
// ═══════════════════════════════════════════════════════════

/**
 * Danh sách status hợp lệ cho order
 * Dùng const array để:
 * 1. Type-safe với "as const"
 * 2. Reuse trong @IsIn() validation
 * 3. Export cho service/controller dùng nếu cần
 */
export const ORDER_STATUSES = [
  'draft',
  'submitted',
  'confirmed',
  'in_production',
  'ready',
  'in_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ═══════════════════════════════════════════════════════════
// CREATE ORDER
// ═══════════════════════════════════════════════════════════

/**
 * Item trong order - nested object
 */
export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ description: 'Quantity to order', example: 10 })
  @IsInt()
  @IsPositive()
  quantity: number;
}

/**
 * DTO để tạo order mới
 *
 * VÍ DỤ REQUEST:
 * POST /orders
 * {
 *   "storeId": 1,
 *   "requestedDate": "2026-01-20",
 *   "notes": "Urgent order",
 *   "items": [{ "productId": 1, "quantity": 10 }]
 * }
 */
export class CreateOrderDto {
  @ApiProperty({ description: 'Store placing the order', example: 1 })
  @IsInt()
  @IsPositive()
  storeId: number;

  @ApiProperty({ description: 'Requested delivery date', example: '2026-01-20' })
  @IsDateString()
  requestedDate: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true }) // Validate từng item trong array
  @Type(() => CreateOrderItemDto) // Transform nested objects
  items: CreateOrderItemDto[];
}

// ═══════════════════════════════════════════════════════════
// UPDATE ORDER STATUS
// ═══════════════════════════════════════════════════════════

/**
 * DTO để update status của order
 *
 * VÍ DỤ REQUEST:
 * PUT /orders/1/status
 * { "status": "confirmed", "notes": "Approved by manager" }
 *
 * VALIDATION:
 * - @IsIn(ORDER_STATUSES) đảm bảo chỉ accept status hợp lệ
 * - Nếu gửi status không hợp lệ → 400 Bad Request
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: ORDER_STATUSES,
    example: 'confirmed',
  })
  @IsIn(ORDER_STATUSES, { message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Status change notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
