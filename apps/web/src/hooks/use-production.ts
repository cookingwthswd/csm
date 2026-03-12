import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '@/lib/api';
import type {
  CreatePlanDtoType,
  UpdatePlanDtoType,
  UpdatePlanStatusDtoType,
  UpdateProductionDetailDtoType,
} from '@repo/types';

export function useProductionPlans(page: number, limit: number) {
  return useQuery({
    queryKey: ['production-plans', page, limit],
    queryFn: () => productionApi.getPlans(page, limit),
  });
}

export function useProductionPlan(id: number) {
  return useQuery({
    queryKey: ['production-plans', id],
    queryFn: () => productionApi.getPlanById(id),
    enabled: !!id,
  });
}

export function useCreateProductionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanDtoType) => productionApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
    },
  });
}

export function useUpdateProductionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanDtoType }) =>
      productionApi.updatePlan(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-plans', id] });
    },
  });
}

export function useUpdateProductionPlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanStatusDtoType }) =>
      productionApi.updatePlanStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-plans', id] });
    },
  });
}

export function useProductionMaterials(planId: number) {
  return useQuery({
    queryKey: ['production-plans', planId, 'materials'],
    queryFn: () => productionApi.getMaterialsRequired(planId),
    enabled: !!planId,
  });
}

export function useUpdateProductionDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      detailId,
      data,
    }: {
      planId: number;
      detailId: number;
      data: UpdateProductionDetailDtoType;
    }) => productionApi.updateDetailQuantity(planId, detailId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans', planId] });
    },
  });
}

export function useCompleteProductionDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, detailId }: { planId: number; detailId: number }) =>
      productionApi.completeDetail(planId, detailId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans', planId] });
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
    },
  });
}

export function useProductionBatches(page: number, limit: number) {
  return useQuery({
    queryKey: ['production-batches', page, limit],
    queryFn: () => productionApi.getBatches(page, limit),
  });
}
