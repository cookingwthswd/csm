import { api } from './client';
import type { UpdateRecipeDtoType } from '@repo/types';

export const recipesApi = {
  /**
   * Return list of products that have recipes setup
   */
  getProductsWithRecipes: () => api.get<any[]>('/recipes'),

  /**
   * Get the recipe definition for a specific product
   */
  getRecipeByProductId: (productId: number) => api.get<any>(`/recipes/${productId}`),

  /**
   * Save or update a product's recipe completely
   */
  saveRecipe: (data: UpdateRecipeDtoType) => api.post<any>('/recipes', data),

  /**
   * Clear an individual detail line in a recipe
   */
  deleteRecipeDetail: (detailId: number) => api.delete<{ success: boolean }>(`/recipes/detail/${detailId}`),
};
