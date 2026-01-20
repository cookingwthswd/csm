import { api } from './client';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '@repo/types';
import type { PaginationMeta } from '@repo/types';

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Products API Service
 */
export const productsApi = {
  /**
   * Get products with pagination and filters
   */
  getAll: (query?: ProductQueryDto) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.categoryId) params.set('categoryId', String(query.categoryId));
    if (query?.type) params.set('type', query.type);
    if (query?.isActive !== undefined)
      params.set('isActive', String(query.isActive));
    if (query?.search) params.set('search', query.search);

    const queryString = params.toString();
    return api.get<PaginatedResponse<Product>>(
      `/products${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get product by ID
   */
  getById: (id: number) => api.get<Product>(`/products/${id}`),

  /**
   * Create new product
   */
  create: (data: CreateProductDto) => api.post<Product>('/products', data),

  /**
   * Update product
   */
  update: (id: number, data: UpdateProductDto) =>
    api.put<Product>(`/products/${id}`, data),

  /**
   * Delete (deactivate) product
   */
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/products/${id}`),
};
