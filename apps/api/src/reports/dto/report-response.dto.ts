/**
 * Report response DTOs - shape of API responses for reports
 * Used for documentation and type safety; actual data built in service
 */

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
  productId?: number;
  productName?: string;
  planned: number;
  produced: number;
  batches: number;
}

export interface ProductionReport {
  summary: { totalPlanned: number; totalProduced: number; plansCompleted: number };
  series: ProductionReportSeries[];
}

export interface InventoryReportSeries {
  date?: string;
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
  items: InventoryReportSeries[];
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
