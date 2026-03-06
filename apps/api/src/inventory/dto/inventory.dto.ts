/**
 * Inventory DTOs
 * 
 * Re-exports from @csm/types for consistency with shared type definitions.
 */

export {
  // Enums
  TRANSACTION_TYPE,
  TRANSACTION_TYPE_VALUES,
  type TransactionType,
  ALERT_TYPE,
  ALERT_TYPE_VALUES,
  type AlertType,
  ALERT_STATUS,
  ALERT_STATUS_VALUES,
  type AlertStatus,
  // Inventory DTOs
  CreateInventoryDto,
  UpdateInventoryLevelsDto,
  InventoryResponse,
  LowStockItemResponse,
  // Transaction DTOs
  CreateTransactionDto,
  TransactionResponse,
  // Alert DTOs
  AlertResponse,
  ResolveAlertDto,
  AlertCountResponse,
} from '@repo/types';
