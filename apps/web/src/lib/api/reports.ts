import { api } from './client';
import type {
  DashboardOverview,
  DeliveryReport,
  InventoryReport,
  OrdersReport,
  ProductionReport,
  ReportGroupBy,
  ReportQuery,
} from '@repo/types';

function buildQuery(params: Partial<ReportQuery>): string {
  const search = new URLSearchParams();

  if (params.type) search.set('type', params.type);
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  if (params.storeId) search.set('storeId', String(params.storeId));
  if (params.groupBy) search.set('groupBy', params.groupBy as ReportGroupBy);
  if (params.search) search.set('search', params.search);

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reportsApi = {
  getOverview: async (storeId?: number) => {
    const qs = storeId ? `?storeId=${storeId}` : '';
    return api.get<DashboardOverview>(`/reports/overview${qs}`);
  },

  getOrdersReport: async (query: ReportQuery) => {
    const qs = buildQuery({ ...query, type: 'orders' });
    return api.get<OrdersReport>(`/reports/orders${qs}`);
  },

  getProductionReport: async (query: ReportQuery) => {
    const qs = buildQuery({ ...query, type: 'production' });
    return api.get<ProductionReport>(`/reports/production${qs}`);
  },

  getInventoryReport: async (query: ReportQuery) => {
    const qs = buildQuery({ ...query, type: 'inventory' });
    return api.get<InventoryReport>(`/reports/inventory${qs}`);
  },

  getDeliveryReport: async (query: ReportQuery) => {
    const qs = buildQuery({ ...query, type: 'delivery' });
    return api.get<DeliveryReport>(`/reports/delivery${qs}`);
  },
};

