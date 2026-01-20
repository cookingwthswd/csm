import { api } from './client';
import type {
  Store,
  CreateStoreDto,
  UpdateStoreDto,
  StoreQueryDto,
} from '@repo/types';

/**
 * Stores API Service
 */
export const storesApi = {
  /**
   * Get all stores with optional filters
   */
  getAll: (query?: StoreQueryDto) => {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.is_active !== undefined)
      params.set('is_active', String(query.is_active));

    const queryString = params.toString();
    return api.get<Store[]>(`/stores${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get store by ID
   */
  getById: (id: number) => api.get<Store>(`/stores/${id}`),

  /**
   * Create new store
   */
  create: (data: CreateStoreDto) => api.post<Store>('/stores', data),

  /**
   * Update store
   */
  update: (id: number, data: UpdateStoreDto) =>
    api.put<Store>(`/stores/${id}`, data),

  /**
   * Delete (deactivate) store
   */
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/stores/${id}`),
};
