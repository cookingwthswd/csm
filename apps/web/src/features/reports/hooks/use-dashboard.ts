import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import type {
  DashboardOverview,
  OrdersReport,
  ProductionReport,
  ReportQuery,
} from '@repo/types';

function createDateRange(days: number): { dateFrom: string; dateTo: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

  return {
    dateFrom: toIsoDate(start),
    dateTo: toIsoDate(end),
  };
}

export function useDashboard(storeId?: number) {
  const defaultOrdersQuery: ReportQuery = useMemo(
    () => ({
      type: 'orders',
      ...createDateRange(7),
      storeId,
      groupBy: 'day',
    }),
    [storeId],
  );

  const defaultProductionQuery: ReportQuery = useMemo(
    () => ({
      type: 'production',
      ...createDateRange(7),
      groupBy: 'day',
    }),
    [],
  );

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview', storeId],
    queryFn: () => reportsApi.getOverview(storeId),
  });

  const {
    data: ordersReport,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery<OrdersReport>({
    queryKey: ['dashboard-orders-report', defaultOrdersQuery],
    queryFn: () => reportsApi.getOrdersReport(defaultOrdersQuery),
  });

  const {
    data: productionReport,
    isLoading: productionLoading,
    error: productionError,
  } = useQuery<ProductionReport>({
    queryKey: ['dashboard-production-report', defaultProductionQuery],
    queryFn: () => reportsApi.getProductionReport(defaultProductionQuery),
  });

  return {
    overview,
    overviewLoading,
    overviewError,
    ordersReport,
    ordersLoading,
    ordersError,
    productionReport,
    productionLoading,
    productionError,
  };
}

