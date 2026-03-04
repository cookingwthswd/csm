import { z } from 'zod';

export const ProductionStatus = z.enum([
  'planned',
  'in_progress',
  'completed',
  'cancelled',
]);
export type ProductionStatusEnum = z.infer<typeof ProductionStatus>;

export const BatchStatus = z.enum(['active', 'depleted', 'expired']);
export type BatchStatusEnum = z.infer<typeof BatchStatus>;

export const CreatePlanDetailDto = z.object({
  itemId: z.number().int().positive(),
  quantityPlanned: z.number().positive(),
});

export const CreatePlanDto = z.object({
  startDate: z.string().date(),
  endDate: z.string().date().optional(), // Make it optional for flexibility
  notes: z.string().optional(),
  details: z.array(CreatePlanDetailDto).min(1, 'Production plan must have at least one detail item'),
});
export type CreatePlanDtoType = z.infer<typeof CreatePlanDto>;

export const UpdatePlanDto = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  notes: z.string().optional(),
});
export type UpdatePlanDtoType = z.infer<typeof UpdatePlanDto>;

export const UpdatePlanStatusDto = z.object({
  status: ProductionStatus,
  notes: z.string().optional(),
});
export type UpdatePlanStatusDtoType = z.infer<typeof UpdatePlanStatusDto>;

export const UpdateProductionDetailDto = z.object({
  quantityProduced: z.number().min(0),
});
export type UpdateProductionDetailDtoType = z.infer<typeof UpdateProductionDetailDto>;

export const CreateBatchDto = z.object({
  itemId: z.number().int().positive(),
  manufactureDate: z.string().date(),
  expiryDate: z.string().date(),
  initialQuantity: z.number().positive(),
  productionDetailId: z.number().int().positive().optional(),
});
export type CreateBatchDtoType = z.infer<typeof CreateBatchDto>;

export const UpdateBatchDto = z.object({
  status: BatchStatus.optional(),
  currentQuantity: z.number().min(0).optional(),
});
export type UpdateBatchDtoType = z.infer<typeof UpdateBatchDto>;

export const ProductionPlanResponse = z.object({
  id: z.number(),
  planCode: z.string(),
  status: ProductionStatus,
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type ProductionPlanResponseType = z.infer<typeof ProductionPlanResponse>;
