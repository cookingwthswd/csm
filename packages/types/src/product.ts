import { z } from 'zod';

/**
 * Product (Item) Types
 */

export const ItemType = z.enum(['material', 'semi_finished', 'finished_product']);
export type ItemType = z.infer<typeof ItemType>;

export const ItemUnit = z.enum(['kg', 'g', 'l', 'ml', 'pcs', 'box', 'can', 'pack']);
export type ItemUnit = z.infer<typeof ItemUnit>;

export const Product = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.number(),
  categoryName: z.string().nullable(),
  unit: ItemUnit,
  type: ItemType,
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
});
export type Product = z.infer<typeof Product>;

export const CreateProductDto = z.object({
  name: z.string().min(2).max(255),
  sku: z.string().min(2).max(100),
  categoryId: z.number().int().positive(),
  unit: ItemUnit,
  type: ItemType,
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type CreateProductDto = z.infer<typeof CreateProductDto>;

export const UpdateProductDto = CreateProductDto.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductDto>;

export const ProductQueryDto = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  categoryId: z.number().int().positive().optional(),
  type: ItemType.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});
export type ProductQueryDto = z.infer<typeof ProductQueryDto>;
