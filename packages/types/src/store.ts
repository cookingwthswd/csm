import { z } from 'zod';

/**
 * Store Types
 */

export const StoreType = z.enum(['franchise', 'central_kitchen']);
export type StoreType = z.infer<typeof StoreType>;

export const Store = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(),
  type: StoreType,
  phone: z.string().nullable(),
  isActive: z.boolean(),
  settings: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Store = z.infer<typeof Store>;

export const CreateStoreDto = z.object({
  name: z.string().min(2).max(255),
  address: z.string().max(500).optional(),
  type: StoreType,
  phone: z.string().max(20).optional(),
  is_active: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
export type CreateStoreDto = z.infer<typeof CreateStoreDto>;

export const UpdateStoreDto = CreateStoreDto.partial();
export type UpdateStoreDto = z.infer<typeof UpdateStoreDto>;

export const StoreQueryDto = z.object({
  type: StoreType.optional(),
  is_active: z.boolean().optional(),
});
export type StoreQueryDto = z.infer<typeof StoreQueryDto>;
