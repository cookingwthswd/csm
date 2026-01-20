import { z } from 'zod';

/**
 * Category Types
 */

export const Category = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});
export type Category = z.infer<typeof Category>;

export const CreateCategoryDto = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(500).optional(),
});
export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;

export const UpdateCategoryDto = CreateCategoryDto.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;
