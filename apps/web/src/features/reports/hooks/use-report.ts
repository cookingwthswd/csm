'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReportQuery } from '@/lib/api/reports';
import {
  reportsApi,
  type OrdersReport,
  type ProductionReport,
  type InventoryReport,
  type DeliveryReport,
} from '@/lib/api/reports';

export function useOrdersReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'orders', query],
    queryFn: () => reportsApi.getOrdersReport(query),
  });
}

export function useProductionReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'production', query],
    queryFn: () => reportsApi.getProductionReport(query),
  });
}

export function useInventoryReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'inventory', query],
    queryFn: () => reportsApi.getInventoryReport(query),
  });
}

export function useDeliveryReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'delivery', query],
    queryFn: () => reportsApi.getDeliveryReport(query),
  });
}
