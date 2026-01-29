import { z } from 'zod';


/**
 * Order Types for CKMS
 *
 * Zod 4.x Changes:
 * - z.string().date() → DEPRECATED
 * - Use z.string().regex() with ISO date pattern instead
 */

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * ISO Date string validator (YYYY-MM-DD)
 * Zod 4.x: Replace deprecated .date() with regex
 */
const isoDateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  { message: 'Must be YYYY-MM-DD format' }
);

// ═══════════════════════════════════════════════════════════
// ORDER STATUS
// ═══════════════════════════════════════════════════════════

export const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus =
  typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);


export const statusColors: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: "bg-gray-100 text-gray-800",
  [ORDER_STATUS.APPROVED]: "bg-blue-100 text-blue-800",
  [ORDER_STATUS.PROCESSING]: "bg-orange-100 text-orange-800",
  [ORDER_STATUS.PROCESSED]: "bg-purple-100 text-purple-800",
  [ORDER_STATUS.SHIPPING]: "bg-yellow-100 text-yellow-800",
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-800",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800",
};

// ═══════════════════════════════════════════════════════════
// CREATE ORDER DTOs
// ═══════════════════════════════════════════════════════════

export const CreateOrderItemDto = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().optional()
});
export type CreateOrderItemDto = z.infer<typeof CreateOrderItemDto>;

export const CreateOrderDto = z.object({
  storeId: z.number().int().positive(),
  requestedDate: isoDateString, // Using non-deprecated validator
  notes: z.string().optional(),
  items: z.array(CreateOrderItemDto).min(1),
});
export type CreateOrderDto = z.infer<typeof CreateOrderDto>;

export const OrderItemResponse = z.object({
  id: z.number(),
  itemId: z.number(),
  itemName: z.string(),
  quantity: z.number(),
  unitPrice: z.number().nullable(),
  type: z.string(),
  notes: z.string().nullable()
});
export type OrderItemResponse = z.infer<typeof OrderItemResponse>;

export const OrderResponse = z.object({ 
  id: z.number(),
  chainId: z.number(),
  storeId: z.number(),
  storeName: z.string().optional(),
  orderCode: z.string(),
  status: ORDER_STATUS_VALUES,
  requestedDate: z.string(),
  totalAmount: z.number().nullable(),
  items: z.array(OrderItemResponse),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  creatorRole: z.string(),
  deliveryDate: z.string().nullable(),
  notes: z.string().nullable()
});
export type OrderResponse = z.infer<typeof OrderResponse>;

export const Pagination = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})
export type Pagination = z.infer<typeof Pagination>;

export type OrderResponseWithPagination = {
  data: OrderResponse[];
  meta: Pagination;
};

export const UpdateOrderStatusDto = z.object({
  status: ORDER_STATUS_VALUES,
  notes: z.string().optional(),
});
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusDto>;
