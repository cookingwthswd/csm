import { api } from './client';
import type {
  CreatePlanDtoType,
  UpdatePlanDtoType,
  UpdatePlanStatusDtoType,
  UpdateProductionDetailDtoType,
  ProductionPlanResponseType,
} from '@repo/types';
import type { PaginationMeta } from '@repo/types';

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const productionApi = {
  getPlans: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<ProductionPlanResponseType>>(`/production/plans?page=${page}&limit=${limit}`),

  getPlanById: (id: number) => api.get<any>(`/production/plans/${id}`),

  createPlan: (data: CreatePlanDtoType) => api.post<ProductionPlanResponseType>('/production/plans', data),

  updatePlan: (id: number, data: UpdatePlanDtoType) => api.put<ProductionPlanResponseType>(`/production/plans/${id}`, data),

  updatePlanStatus: (id: number, data: UpdatePlanStatusDtoType) =>
    api.put<ProductionPlanResponseType>(`/production/plans/${id}/status`, data),

  getMaterialsRequired: (id: number) => api.get<any[]>(`/production/plans/${id}/materials`),

  updateDetailQuantity: (planId: number, detailId: number, data: UpdateProductionDetailDtoType) =>
    api.put<any>(`/production/plans/${planId}/details/${detailId}`, data),

  completeDetail: (planId: number, detailId: number) =>
    api.post<any>(`/production/plans/${planId}/details/${detailId}/complete`, {}),

  getBatches: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<any>>(`/production/batches?page=${page}&limit=${limit}`),
};
