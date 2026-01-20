import { api } from './client';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@repo/types';

/**
 * Categories API Service
 */
export const categoriesApi = {
  /**
   * Get all categories
   */
  getAll: () => api.get<Category[]>('/categories'),

  /**
   * Get category by ID
   */
  getById: (id: number) => api.get<Category>(`/categories/${id}`),

  /**
   * Create new category
   */
  create: (data: CreateCategoryDto) =>
    api.post<Category>('/categories', data),

  /**
   * Update category
   */
  update: (id: number, data: UpdateCategoryDto) =>
    api.put<Category>(`/categories/${id}`, data),

  /**
   * Delete category
   */
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/categories/${id}`),
};
