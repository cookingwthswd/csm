import { api } from './client';
import {
  InventoryResponse,
  LowStockItemResponse,
  CreateInventoryDto,
  UpdateInventoryLevelsDto,
  CreateTransactionDto,
  TransactionResponse,
  AlertResponse,
  AlertCountResponse,
  ResolveAlertDto,
} from '@repo/types';

/**
 * Inventory API Service
 */
export const inventoryApi = {
  // Stock
  getAll: async (storeId?: number) => {
    const params = new URLSearchParams();
    if (storeId) params.set('storeId', String(storeId));
    const qs = params.toString();
    return api.get<InventoryResponse[]>(`/inventory${qs ? `?${qs}` : ''}`);
  },
  getByStoreAndItem: async (storeId: number, itemId: number) =>
    api.get<InventoryResponse>(`/inventory/${storeId}/${itemId}`),
  createInventory: async (data: CreateInventoryDto) =>
    api.post<InventoryResponse>('/inventory', data),
  updateLevels: async (id: number, data: UpdateInventoryLevelsDto) =>
    api.put<InventoryResponse>(`/inventory/${id}`, data),
  getLowStock: async (storeId?: number) => {
    const params = new URLSearchParams();
    if (storeId) params.set('storeId', String(storeId));
    const qs = params.toString();
    return api.get<LowStockItemResponse[]>(`/inventory/low-stock${qs ? `?${qs}` : ''}`);
  },

  // Transactions
  getTransactions: async (query?: { storeId?: number; itemId?: number }) => {
    const params = new URLSearchParams();
    if (query?.storeId) params.set('storeId', String(query.storeId));
    if (query?.itemId) params.set('itemId', String(query.itemId));
    const qs = params.toString();
    return api.get<TransactionResponse[]>(
      `/inventory/transactions${qs ? `?${qs}` : ''}`
    );
  },
  getTransactionById: async (id: number) =>
    api.get<TransactionResponse>(`/inventory/transactions/${id}`),
  createTransaction: async (data: CreateTransactionDto) =>
    api.post<TransactionResponse>('/inventory/transactions', data),

  // Alerts
  getAlerts: async () =>
    api.get<AlertResponse[]>(`/inventory/alerts`),
  getAlertCount: async () => api.get<AlertCountResponse>(`/inventory/alerts/count`),
  resolveAlert: async (id: number, data: ResolveAlertDto) =>
    api.put<AlertResponse>(`/inventory/alerts/${id}/resolve`, data),
};
