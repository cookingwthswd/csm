import { z } from 'zod';

export const RecipeDetailDto = z.object({
  materialId: z.number().int().positive(),
  quantity: z.number().positive(),
});
export type RecipeDetailDtoType = z.infer<typeof RecipeDetailDto>;

export const UpdateRecipeDto = z.object({
  productId: z.number().int().positive(),
  materials: z.array(RecipeDetailDto).min(1, 'Recipe must have at least one material'),
});
export type UpdateRecipeDtoType = z.infer<typeof UpdateRecipeDto>;

export const MaterialNeededResponse = z.object({
  materialId: z.number(),
  materialName: z.string(),
  unit: z.string(),
  requiredQuantity: z.number(),
  currentStock: z.number().optional(),
  shortage: z.number().optional(),
});
export type MaterialNeededResponseType = z.infer<typeof MaterialNeededResponse>;
