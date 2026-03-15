import { api } from "./client";

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

export interface CreateBatchPayload {
  batch_code?: string;
  item_id: number;
  manufacture_date?: string;
  expiry_date?: string;
  initial_quantity: number;
  current_quantity?: number;
  status?: 'active' | 'expired' | 'depleted';
}

export type UpdateBatchPayload = Partial<CreateBatchPayload>;

export const batchesApi = {

  /**
   * Batch list
   */
  getBatches: () =>
    api.get<BatchRecord[]>(`/batches`),

  /**
   * Batch detail
   */
  getBatchDetail: (batchId: number) =>
    api.get<BatchRecord>(`/batches/${batchId}`),

  /**
   * Batch transactions
   */
  getBatchTransactions: (batchId: number) =>
    api.get<InventoryTransactionRecord[]>(
      `/batches/${batchId}/transactions`
    ),

  /**
   * Create batch
   */
  createBatch: (payload: CreateBatchPayload) =>
    api.post<BatchRecord>(`/batches`, payload),

  /**
   * Update batch
   */
  updateBatch: (batchId: number, payload: UpdateBatchPayload) =>
    api.put<BatchRecord>(`/batches/${batchId}`, payload),
};
