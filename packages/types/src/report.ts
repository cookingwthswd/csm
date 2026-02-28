import { z } from 'zod';

export const ReportType = z.enum([
  'orders',
  'production',
  'inventory',
  'delivery',
]);
export type ReportType = z.infer<typeof ReportType>;

export const ReportGroupBy = z.enum(['day', 'week', 'month']);
export type ReportGroupBy = z.infer<typeof ReportGroupBy>;

export const ReportQuery = z.object({
  type: ReportType.optional(),
  dateFrom: z.string(),
  dateTo: z.string(),
  storeId: z.number().int().optional(),
  groupBy: ReportGroupBy.default('day'),
  search: z.string().optional(),
});
export type ReportQuery = z.infer<typeof ReportQuery>;

export const DashboardOverview = z.object({
  totalOrders: z.number(),
  pendingOrders: z.number(),
  completedOrders: z.number(),
  totalRevenue: z.number(),
  lowStockItems: z.number(),
  pendingDeliveries: z.number(),
});
export type DashboardOverview = z.infer<typeof DashboardOverview>;

export const OrdersReportPoint = z.object({
  date: z.string(),
  totalOrders: z.number(),
  completedOrders: z.number(),
  pendingOrders: z.number(),
  revenue: z.number(),
});
export type OrdersReportPoint = z.infer<typeof OrdersReportPoint>;

export const OrdersReport = z.object({
  points: z.array(OrdersReportPoint),
});
export type OrdersReport = z.infer<typeof OrdersReport>;

export const ProductionReportPoint = z.object({
  date: z.string(),
  productName: z.string(),
  quantityPlanned: z.number(),
  quantityProduced: z.number(),
});
export type ProductionReportPoint = z.infer<typeof ProductionReportPoint>;

export const ProductionReport = z.object({
  points: z.array(ProductionReportPoint),
});
export type ProductionReport = z.infer<typeof ProductionReport>;

export const InventoryReportRow = z.object({
  itemId: z.number(),
  itemName: z.string(),
  storeId: z.number(),
  storeName: z.string().nullable(),
  quantity: z.number(),
  minStockLevel: z.number().nullable(),
  isLowStock: z.boolean(),
});
export type InventoryReportRow = z.infer<typeof InventoryReportRow>;

export const InventoryReport = z.object({
  rows: z.array(InventoryReportRow),
});
export type InventoryReport = z.infer<typeof InventoryReport>;

export const DeliveryReportPoint = z.object({
  date: z.string(),
  totalShipments: z.number(),
  deliveredShipments: z.number(),
  failedShipments: z.number(),
  averageDeliveryTimeMinutes: z.number().nullable(),
});
export type DeliveryReportPoint = z.infer<typeof DeliveryReportPoint>;

export const DeliveryReport = z.object({
  points: z.array(DeliveryReportPoint),
});
export type DeliveryReport = z.infer<typeof DeliveryReport>;

