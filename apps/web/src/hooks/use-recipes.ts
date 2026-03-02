import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '@/lib/api';
import type { UpdateRecipeDtoType } from '@repo/types';

export function useProductsWithRecipes() {
  return useQuery({
    queryKey: ['recipes', 'products'],
    queryFn: () => recipesApi.getProductsWithRecipes(),
  });
}

export function useRecipeByProductId(productId: number) {
  return useQuery({
    queryKey: ['recipes', 'product', productId],
    queryFn: () => recipesApi.getRecipeByProductId(productId),
    enabled: !!productId,
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRecipeDtoType) => recipesApi.saveRecipe(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', 'product', variables.productId] });
    },
  });
}

export function useDeleteRecipeDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (detailId: number) => recipesApi.deleteRecipeDetail(detailId),
    onSuccess: () => {
      // Due to relation caching, typically easier to just invalidate all recipes
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
