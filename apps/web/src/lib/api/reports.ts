import { api } from './client';
import { useAuthStore } from '@/lib/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ReportType = 'orders' | 'production' | 'inventory' | 'delivery';
export type GroupByOption = 'day' | 'week' | 'month';

export interface ReportQuery {
  type?: ReportType;
  dateFrom?: string;
  dateTo?: string;
  storeId?: number;
  groupBy?: GroupByOption;
}

export interface DashboardOverview {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingDeliveries: number;
}

export interface OrdersReportSeries {
  date: string;
  total: number;
  completed: number;
  revenue: number;
  byStatus?: Record<string, number>;
}

export interface OrdersReport {
  summary: { total: number; completed: number; cancelled: number; revenue: number };
  series: OrdersReportSeries[];
}

export interface ProductionReportSeries {
  date: string;
  planned: number;
  produced: number;
  batches: number;
}

export interface ProductionReport {
  summary: { totalPlanned: number; totalProduced: number; plansCompleted: number };
  series: ProductionReportSeries[];
}

export interface InventoryReportItem {
  itemId: number;
  itemName: string;
  storeId?: number;
  storeName?: string;
  quantity: number;
  minStockLevel: number;
  status: 'ok' | 'low' | 'out';
}

export interface InventoryReport {
  summary: { totalItems: number; lowStockCount: number; outOfStockCount: number };
  items: InventoryReportItem[];
  alerts?: { id: number; message: string; alertType: string; storeId: number }[];
}

export interface DeliveryReportSeries {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  avgDeliveryHours?: number;
}

export interface DeliveryReport {
  summary: { total: number; delivered: number; failed: number; successRate: number };
  series: DeliveryReportSeries[];
}

function buildQuery(params: ReportQuery): string {
  const q = new URLSearchParams();
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.storeId != null) q.set('storeId', String(params.storeId));
  if (params.groupBy) q.set('groupBy', params.groupBy);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const reportsApi = {
  getOverview: () => api.get<DashboardOverview>('/reports/overview'),

  getOrdersReport: (query: ReportQuery) =>
    api.get<OrdersReport>(`/reports/orders${buildQuery(query)}`),

  getProductionReport: (query: ReportQuery) =>
    api.get<ProductionReport>(`/reports/production${buildQuery(query)}`),

  getInventoryReport: (query: ReportQuery) =>
    api.get<InventoryReport>(`/reports/inventory${buildQuery(query)}`),

  getDeliveryReport: (query: ReportQuery) =>
    api.get<DeliveryReport>(`/reports/delivery${buildQuery(query)}`),

  /**
   * Download export file (CSV/PDF). Fetches with auth and returns blob for download.
   */
  downloadExport: async (
    query: ReportQuery & { type?: ReportType; format?: 'csv' | 'pdf' }
  ): Promise<Blob> => {
    const q = buildQuery(query);
    const sep = q ? '&' : '?';
    const type = query.type ?? 'orders';
    const format = query.format ?? 'csv';
    const url = `${API_URL}/reports/export${q}${sep}type=${type}&format=${format}`;
    const token = useAuthStore.getState().session?.access_token ?? '';
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(`Export failed: ${response.status}`);
    return response.blob();
  },
};
