import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  DashboardOverview,
  DeliveryReport,
  InventoryReport,
  OrdersReport,
  ProductionReport,
} from './dto/report-response.dto';
import type { GroupByOption, ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  private get client() {
    return this.supabase.client;
  }

  private handleError(error: PostgrestError, context: string): never {
    console.error(`[ReportsService] ${context}:`, error);
    throw new InternalServerErrorException(`Report error: ${context}`);
  }

  /**
   * Dashboard overview stats (real-time aggregates)
   */
  async getOverview(): Promise<DashboardOverview> {
    const [ordersRes, alertsRes, shipmentsRes] = await Promise.all([
      this.client.from('orders').select('id, status, total_amount'),
      this.client
        .from('alerts')
        .select('id')
        .eq('is_resolved', false)
        .in('alert_type', ['low_stock', 'out_of_stock']),
      this.client
        .from('shipments')
        .select('id')
        .not('status', 'in', '("delivered","failed")'),
    ]);

    if (ordersRes.error) this.handleError(ordersRes.error, 'fetch orders');
    if (alertsRes.error) this.handleError(alertsRes.error, 'fetch alerts');
    if (shipmentsRes.error) this.handleError(shipmentsRes.error, 'fetch shipments');

    const orders = ordersRes.data ?? [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
    const lowStockItems = alertsRes.data?.length ?? 0;
    const pendingDeliveries = shipmentsRes.data?.length ?? 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      lowStockItems,
      pendingDeliveries,
    };
  }

  /**
   * Orders analytics: series by date + summary
   */
  async getOrdersReport(query: ReportQueryDto): Promise<OrdersReport> {
    const { dateFrom, dateTo, storeId, groupBy = 'day' } = query;
    let q = this.client
      .from('orders')
      .select('id, status, total_amount, created_at')
      .order('created_at', { ascending: true });

    if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00Z`);
    if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59Z`);
    if (storeId) q = q.eq('store_id', storeId);

    const { data, error } = await q;
    if (error) this.handleError(error, 'fetch orders report');

    const rows = data ?? [];
    const series = this.groupByDate(
      rows,
      groupBy,
      (r) => r.created_at,
      ({ key, rows: groupRows }) => {
        const completed = groupRows.filter((r) => r.status === 'delivered').length;
        const revenue = groupRows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
        const byStatus: Record<string, number> = {};
        groupRows.forEach((r) => {
          byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        });
        return {
          date: key,
          total: groupRows.length,
          completed,
          revenue,
          byStatus,
        };
      },
    );

    const summary = {
      total: rows.length,
      completed: rows.filter((r) => r.status === 'delivered').length,
      cancelled: rows.filter((r) => r.status === 'cancelled').length,
      revenue: rows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0),
    };

    return { summary, series };
  }

  /**
   * Production analytics: batches / plans by date
   */
  async getProductionReport(query: ReportQueryDto): Promise<ProductionReport> {
    const { dateFrom, dateTo, groupBy = 'day' } = query;

    const { data: planRows, error: planErr } = await this.client
      .from('production_plans')
      .select('id, start_date, status')
      .order('start_date', { ascending: true });

    if (planErr) this.handleError(planErr, 'fetch production plans');

    let detailsQ = this.client
      .from('production_details')
      .select(
        'id, plan_id, item_id, quantity_planned, quantity_produced, status, started_at, completed_at',
      );

    const { data: detailRows, error: detailErr } = await detailsQ;
    if (detailErr) this.handleError(detailErr, 'fetch production details');

    const plans = planRows ?? [];
    const details = detailRows ?? [];

    const filterByDate = (dateStr: string) => {
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      return true;
    };

    const itemIds = [...new Set(details.map((d) => d.item_id))];
    const { data: items } =
      itemIds.length > 0
        ? await this.client.from('items').select('id, name').in('id', itemIds)
        : { data: [] };
    const itemMap = new Map((items ?? []).map((i) => [i.id, i.name]));

    const planMap = new Map(plans.map((p) => [p.id, p]));
    const rows = details.map((d) => {
      const plan = planMap.get(d.plan_id);
      const dateStr = plan?.start_date ?? d.started_at?.slice(0, 10) ?? '';
      return {
        ...d,
        dateStr,
        productName: itemMap.get(d.item_id) ?? `Item ${d.item_id}`,
      };
    }).filter((r) => r.dateStr && filterByDate(r.dateStr));

    const series = this.groupByDate(
      rows,
      groupBy,
      (r) => r.dateStr,
      ({ key, rows: groupRows }) => ({
        date: key,
        planned: groupRows.reduce((s, r) => s + Number(r.quantity_planned), 0),
        produced: groupRows.reduce((s, r) => s + Number(r.quantity_produced), 0),
        batches: groupRows.length,
      }),
    );

    const summary = {
      totalPlanned: rows.reduce((s, r) => s + Number(r.quantity_planned), 0),
      totalProduced: rows.reduce((s, r) => s + Number(r.quantity_produced), 0),
      plansCompleted: plans.filter((p) => p.status === 'completed').length,
    };

    return { summary, series };
  }

  /**
   * Inventory analytics: stock levels and low-stock alerts
   */
  async getInventoryReport(query: ReportQueryDto): Promise<InventoryReport> {
    const { storeId } = query;

    let invQ = this.client
      .from('inventory')
      .select('id, store_id, item_id, quantity, min_stock_level, max_stock_level');
    if (storeId) invQ = invQ.eq('store_id', storeId);

    const { data: invRows, error: invErr } = await invQ;
    if (invErr) this.handleError(invErr, 'fetch inventory');

    const items = invRows ?? [];
    const itemIds = [...new Set(items.map((i) => i.item_id))];
    const storeIds = [...new Set(items.map((i) => i.store_id))];

    const [itemsRes, storesRes, alertsRes] = await Promise.all([
      itemIds.length ? this.client.from('items').select('id, name').in('id', itemIds) : { data: [] },
      storeIds.length ? this.client.from('stores').select('id, name').in('id', storeIds) : { data: [] },
      this.client
        .from('alerts')
        .select('id, store_id, item_id, message, alert_type')
        .eq('is_resolved', false),
    ]);

    const itemMap = new Map((itemsRes.data ?? []).map((i) => [i.id, i.name]));
    const storeMap = new Map((storesRes.data ?? []).map((s) => [s.id, s.name]));

    const reportItems = items.map((i) => {
      const qty = Number(i.quantity);
      const min = Number(i.min_stock_level ?? 0);
      let status: 'ok' | 'low' | 'out' = 'ok';
      if (qty <= 0) status = 'out';
      else if (min > 0 && qty < min) status = 'low';
      return {
        itemId: i.item_id,
        itemName: itemMap.get(i.item_id) ?? `Item ${i.item_id}`,
        storeId: i.store_id,
        storeName: storeMap.get(i.store_id),
        quantity: qty,
        minStockLevel: min,
        status,
      };
    });

    const lowStockCount = reportItems.filter((i) => i.status === 'low').length;
    const outOfStockCount = reportItems.filter((i) => i.status === 'out').length;
    const alerts = (alertsRes.data ?? []).map((a) => ({
      id: a.id,
      message: a.message ?? '',
      alertType: a.alert_type,
      storeId: a.store_id,
    }));

    return {
      summary: {
        totalItems: reportItems.length,
        lowStockCount,
        outOfStockCount,
      },
      items: reportItems,
      alerts,
    };
  }

  /**
   * Delivery analytics: shipments by date, success rate
   */
  async getDeliveryReport(query: ReportQueryDto): Promise<DeliveryReport> {
    const { dateFrom, dateTo, groupBy = 'day' } = query;

    let q = this.client
      .from('shipments')
      .select('id, status, shipped_date, delivered_date, order_id')
      .order('shipped_date', { ascending: true });

    if (dateFrom) q = q.gte('shipped_date', `${dateFrom}T00:00:00Z`);
    if (dateTo) q = q.lte('shipped_date', `${dateTo}T23:59:59Z`);

    const { data, error } = await q;
    if (error) this.handleError(error, 'fetch delivery report');

    const rows = data ?? [];

    const series = this.groupByDate(
      rows,
      groupBy,
      (r) => (r.shipped_date ?? r.delivered_date ?? '').toString().slice(0, 10),
      ({ key, rows: groupRows }) => {
        const delivered = groupRows.filter((r) => r.status === 'delivered').length;
        const failed = groupRows.filter((r) => r.status === 'failed').length;
        let avgDeliveryHours: number | undefined;
        const withBoth = groupRows.filter(
          (r) => r.shipped_date && r.delivered_date && r.status === 'delivered',
        );
        if (withBoth.length > 0) {
          const totalHours = withBoth.reduce((s, r) => {
            const ms =
              new Date(r.delivered_date!).getTime() - new Date(r.shipped_date!).getTime();
            return s + ms / (1000 * 60 * 60);
          }, 0);
          avgDeliveryHours = Math.round((totalHours / withBoth.length) * 10) / 10;
        }
        return {
          date: key,
          total: groupRows.length,
          delivered,
          failed,
          avgDeliveryHours,
        };
      },
    ).filter((s) => s.date);

    const total = rows.length;
    const delivered = rows.filter((r) => r.status === 'delivered').length;
    const failed = rows.filter((r) => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0;

    return {
      summary: { total, delivered, failed, successRate },
      series,
    };
  }

  /**
   * Export report as CSV (or PDF stub)
   */
  async exportReport(
    query: ReportQueryDto & { type?: string },
    format: 'csv' | 'pdf',
  ): Promise<Buffer> {
    const type = (query.type ?? 'orders') as 'orders' | 'production' | 'inventory' | 'delivery';
    if (format === 'pdf') {
      // PDF would require pdfkit or similar; return CSV for now with note
      return this.exportReport({ ...query, type }, 'csv');
    }

    let csv = '';
    switch (type) {
      case 'orders': {
        const report = await this.getOrdersReport(query);
        csv = 'date,total,completed,revenue\n';
        report.series.forEach((s) => {
          csv += `${s.date},${s.total},${s.completed},${s.revenue}\n`;
        });
        break;
      }
      case 'production': {
        const report = await this.getProductionReport(query);
        csv = 'date,planned,produced,batches\n';
        report.series.forEach((s) => {
          csv += `${s.date},${s.planned},${s.produced},${s.batches}\n`;
        });
        break;
      }
      case 'inventory': {
        const report = await this.getInventoryReport(query);
        csv = 'itemId,itemName,quantity,minStockLevel,status\n';
        report.items.forEach((i) => {
          csv += `${i.itemId},${escapeCsv(i.itemName)},${i.quantity},${i.minStockLevel},${i.status}\n`;
        });
        break;
      }
      case 'delivery': {
        const report = await this.getDeliveryReport(query);
        csv = 'date,total,delivered,failed,avgDeliveryHours\n';
        report.series.forEach((s) => {
          csv += `${s.date},${s.total},${s.delivered},${s.failed},${s.avgDeliveryHours ?? ''}\n`;
        });
        break;
      }
      default:
        csv = 'type,value\nunknown,0\n';
    }

    return Buffer.from(csv, 'utf-8');
  }

  private groupByDate<T, R>(
    rows: T[],
    groupBy: GroupByOption,
    getDate: (r: T) => string,
    reduce: (group: { key: string; rows: T[] }) => R,
  ): R[] {
    const toKey = (d: string) => {
      if (!d) return '';
      const date = new Date(d);
      if (groupBy === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      if (groupBy === 'week') {
        const start = new Date(date);
        start.setUTCDate(date.getUTCDate() - date.getUTCDay());
        return start.toISOString().slice(0, 10);
      }
      return d.slice(0, 10);
    };

    const map = new Map<string, T[]>();
    rows.forEach((r) => {
      const key = toKey(getDate(r));
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rows]) => reduce({ key, rows }));
  }
}

function escapeCsv(s: string): string {
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
