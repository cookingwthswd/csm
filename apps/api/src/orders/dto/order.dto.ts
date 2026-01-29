import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { OrderStatus } from '@repo/types';

export const ORDER_STATUSES = [
  'pending',
  'approved',
  'processing',
  'processed',
  'shipping',
  'delivered',
  'cancelled',
] as const;

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
// CREATE ORDER
// ═══════════════════════════════════════════════════════════

/**
 * Item trong order - nested object
 */
export class CreateOrderItemDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  orderId: number;

  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Notes about the item', example: 'Không ớt' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Price of the item' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice: number;  
}

/**
 * DTO để tạo order mới
 *
 * VÍ DỤ REQUEST:
 * POST /orders
 * {
 *   "deliveryDate": "2026-01-20",
 *   "notes": "Urgent order",
 *   "items": [{ "itemId": 1, "quantity": 10 }]
 * }
 *
 * NOTE: storeId được lấy từ user context (JWT token), không cần gửi trong request
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Delivery date',
    example: '2026-01-20',
  })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true }) // Validate từng item trong array
  @Type(() => CreateOrderItemDto) // Transform nested objects
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Total amount of the order' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  totalAmount: number;  

  @ApiProperty({ description: 'Store ID', example: 1 })
  @IsInt()
  @IsPositive()
  storeId: number;
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
  @IsIn(ORDER_STATUSES, {
    message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
  })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Status change notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
// ═══════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════

/**
 * Order item response DTO
 */
export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Item ID', example: 1 })
  itemId: number;

  @ApiProperty({ description: 'Item name', example: 'Flour' })
  itemName: string;

  @ApiProperty({ description: 'Quantity ordered', example: 10 })
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 25.5, nullable: true })
  unitPrice: number | null;
}

/**
 * Order response DTO
 */
export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Store ID', example: 1 })
  storeId: number;

  @ApiProperty({ description: 'Creator name' })
  createdBy: string;

  @ApiProperty({ description: 'Creator role' })
  creatorRole: string;

  @ApiProperty({ description: 'Store name', example: 'Downtown Store' })
  storeName: string;

  @ApiProperty({ description: 'Order code', example: 'ORD-20260120-12345' })
  orderCode: string;

  @ApiProperty({ description: 'Order status', enum: ORDER_STATUSES })
  status: OrderStatus;

  @ApiProperty({
    description: 'Delivery date',
    example: '2026-01-20',
    nullable: true,
  })
  deliveryDate: string | null;

  @ApiProperty({ description: 'Total amount', example: 255.0, nullable: true })
  totalAmount: number | null;

  @ApiProperty({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Created at', example: '2026-01-20T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at', example: '2026-01-20T10:00:00Z' })
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════

/**
 * Query parameters for listing orders
 */
export class OrderQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ORDER_STATUSES,
  })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by delivery date from',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  deliveryDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by delivery date to',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  deliveryDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;
}
