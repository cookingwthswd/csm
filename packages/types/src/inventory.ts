import { z } from 'zod';

/**
 * Inventory & Alerts Types for CKMS
 * 
 * Covers:
 * - Stock levels and inventory management
 * - Inventory transactions (movements/adjustments)
 * - Automatic alerts (low stock, out of stock, expiring batches)
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export const TRANSACTION_TYPE = {
  IMPORT: 'import',
  EXPORT: 'export',
  PRODUCTION: 'production',
  WASTE: 'waste',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
} as const;

export type TransactionType =
  typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPE);

export const ALERT_TYPE = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED_FOUND: 'expired_found',
} as const;

export type AlertType =
  typeof ALERT_TYPE[keyof typeof ALERT_TYPE];

export const ALERT_TYPE_VALUES = Object.values(ALERT_TYPE);

export const ALERT_STATUS = {
  UNRESOLVED: 'unresolved',
  RESOLVED: 'resolved',
  ACKNOWLEDGED: 'acknowledged',
} as const;

export type AlertStatus =
  typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

export const ALERT_STATUS_VALUES = Object.values(ALERT_STATUS);

// ═══════════════════════════════════════════════════════════
// INVENTORY DTOs
// ═══════════════════════════════════════════════════════════

export const CreateInventoryDto = z.object({
  storeId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  quantity: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0),
  maxStockLevel: z.number().int().min(0),
});

export type CreateInventoryDto = z.infer<typeof CreateInventoryDto>;

export const UpdateInventoryLevelsDto = z.object({
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
});

export type UpdateInventoryLevelsDto = z.infer<typeof UpdateInventoryLevelsDto>;

export const InventoryResponse = z.object({
  id: z.number(),
  storeId: z.number(),
  storeName: z.string(),
  itemId: z.number(),
  itemName: z.string(),
  itemSku: z.string(),
  quantity: z.number(),
  unit: z.string(),
  minStockLevel: z.number(),
  maxStockLevel: z.number(),
  isLowStock: z.boolean(),
  lastUpdated: z.string().datetime(),
});

export type InventoryResponse = z.infer<typeof InventoryResponse>;

export const LowStockItemResponse = z.object({
  id: z.number(),
  storeId: z.number(),
  storeName: z.string(),
  itemId: z.number(),
  itemName: z.string(),
  itemSku: z.string(),
  quantity: z.number(),
  minStockLevel: z.number(),
  shortage: z.number(),
  lastUpdated: z.string().datetime(),
});

export type LowStockItemResponse = z.infer<typeof LowStockItemResponse>;

// ═══════════════════════════════════════════════════════════
// TRANSACTION DTOs
// ═══════════════════════════════════════════════════════════

export const CreateTransactionDto = z.object({
  storeId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  batchId: z.number().int().positive().optional(),
  quantityChange: z.number().int(), // Positive or negative
  type: z.enum(TRANSACTION_TYPE_VALUES),
  referenceType: z.string().optional(),
  referenceId: z.number().int().optional(),
  note: z.string().max(500).optional(),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionDto>;

export const TransactionResponse = z.object({
  id: z.number(),
  storeId: z.number(),
  storeName: z.string(),
  itemId: z.number(),
  itemName: z.string(),
  itemSku: z.string(),
  batchId: z.number().nullable(),
  quantityChange: z.number(),
  type: z.enum(TRANSACTION_TYPE_VALUES),
  referenceType: z.string().nullable(),
  referenceId: z.number().nullable(),
  note: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
});

export type TransactionResponse = z.infer<typeof TransactionResponse>;

// ═══════════════════════════════════════════════════════════
// ALERT DTOs
// ═══════════════════════════════════════════════════════════

export const AlertResponse = z.object({
  id: z.number(),
  type: z.enum(ALERT_TYPE_VALUES),
  status: z.enum(ALERT_STATUS_VALUES),
  storeId: z.number().nullable(),
  storeName: z.string().nullable(),
  itemId: z.number(),
  itemName: z.string(),
  itemSku: z.string(),
  batchId: z.number().nullable(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});

export type AlertResponse = z.infer<typeof AlertResponse>;

export const ResolveAlertDto = z.object({
  note: z.string().max(500).optional(),
});

export type ResolveAlertDto = z.infer<typeof ResolveAlertDto>;

export const AlertCountResponse = z.object({
  total: z.number(),
  byType: z.record(z.string(), z.number()),
});

export type AlertCountResponse = z.infer<typeof AlertCountResponse>;
