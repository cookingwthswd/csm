import { api } from "./client";

export interface InventorySummaryRecord {
  store_id: number;
  store_name: string;
  total_items: number;
  total_quantity: number;
  last_updated: string;
}

export interface InventoryRecord {
  id: number;
  store_id: number;
  item_id: number;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  last_updated: string;

  items?: {
    id: number;
    name: string;
  };

  stores?: {
    id: number;
    name: string;
  };
}

export interface BatchRecord {
  id: number;
  batch_code: string;
  item_id: number;
  manufacture_date: string;
  expiry_date: string;
  initial_quantity: number;
  current_quantity: number;
  status: string;

  items?: {
    id: number;
    name: string;
  };
}

export interface InventoryTransactionRecord {
  id: number;
  store_id: number;
  item_id: number;
  batch_id: number;
  quantity_change: number;
  transaction_type: string;
  reference_type: string;
  reference_id: number;
  created_at: string;

  batches?: {
    batch_code: string;
  };

  stores?: {
    name: string;
  };
}

export const inventoriesApi = {

  /**
   * Inventory list
   */
  getInventories: () =>
    api.get<InventorySummaryRecord[]>(`/inventories`),

  /**
   * Inventory detail
   */
  getInventoryDetail: (storeId: number) =>
    api.get<InventoryRecord[]>(`/inventories/${storeId}`),
}
