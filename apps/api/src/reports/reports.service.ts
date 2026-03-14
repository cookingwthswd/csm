/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';
import { SupabaseService } from '../common/services/supabase.service';
import {
  DeliveryReportDto,
  DeliveryReportPointDto,
  DashboardOverviewDto,
  InventoryReportDto,
  InventoryReportRowDto,
  OrdersReportDto,
  OrdersReportPointDto,
  ProductionReportDto,
  ProductionReportPointDto,
} from './dto/report-response.dto';
import {
  ReportGroupBy,
  ReportQueryDto,
  ReportType,
} from './dto/report-query.dto';

type DbClient = SupabaseClient<Database>;

@Injectable()
export class ReportsService {
  private client: DbClient;

  constructor(supabase: SupabaseService) {
    this.client = supabase.client as DbClient;
  }

  // Dashboard overview ------------------------------------------------------

  async getOverview(storeId?: number): Promise<DashboardOverviewDto> {
    const [ordersAgg, lowStock, pendingShipments] = await Promise.all([
      this.fetchOrdersOverview(storeId),
      this.fetchLowStockCount(storeId),
      this.fetchPendingDeliveries(storeId),
    ]);

    return {
      totalOrders: ordersAgg.totalOrders,
      pendingOrders: ordersAgg.pendingOrders,
      completedOrders: ordersAgg.completedOrders,
      totalRevenue: ordersAgg.totalRevenue,
      lowStockItems: lowStock,
      pendingDeliveries: pendingShipments,
    };
  }

  private async fetchOrdersOverview(storeId?: number) {
    let query = this.client
      .from('orders')
      .select('status,total_amount', { count: 'exact' });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new InternalServerErrorException('Failed to load order stats');
    }

    const pendingStatuses = ['pending', 'approved', 'processing'];
    const completedStatuses = ['delivered', 'shipping'];

    let pending = 0;
    let completed = 0;
    let revenue = 0;

    for (const row of data ?? []) {
      if (pendingStatuses.includes(row.status as string)) {
        pending += 1;
      }
      if (completedStatuses.includes(row.status as string)) {
        completed += 1;
      }
      if (row.total_amount != null) {
        revenue += Number(row.total_amount);
      }
    }

    return {
      totalOrders: count ?? 0,
      pendingOrders: pending,
      completedOrders: completed,
      totalRevenue: revenue,
    };
  }

  private async fetchLowStockCount(storeId?: number): Promise<number> {
    let query = this.client
      .from('inventory')
      .select('quantity,min_stock_level,store_id');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException('Failed to load low stock items');
    }

    return (data ?? []).filter((row) => {
      if (row.min_stock_level == null) return false;
      const qty = Number(row.quantity ?? 0);
      const min = Number(row.min_stock_level);
      return min > 0 && qty < min;
    }).length;
  }

  private async fetchPendingDeliveries(storeId?: number): Promise<number> {
    let query = this.client
      .from('shipments')
      .select('id, status, orders!inner(store_id)', { count: 'exact', head: true })
      .in('status', ['preparing', 'shipping']);

    if (storeId) {
      query = query.eq('orders.store_id', storeId);
    }

    const { error, count } = await query;

    if (error) {
      throw new InternalServerErrorException('Failed to load pending deliveries');
    }

    return count ?? 0;
  }

  // Orders report -----------------------------------------------------------

  /** End of day for dateTo so the range is inclusive of the full day */
  private toEndOfDay(dateTo: string): string {
    return `${dateTo}T23:59:59.999Z`;
  }

  async getOrdersReport(query: ReportQueryDto): Promise<OrdersReportDto> {
    let dbQuery = this.client
      .from('orders')
      .select('created_at,status,total_amount,store_id')
      .gte('created_at', query.dateFrom)
      .lte('created_at', this.toEndOfDay(query.dateTo));

    if (query.storeId) {
      dbQuery = dbQuery.eq('store_id', query.storeId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException('Failed to load orders report');
    }

    const groups = new Map<string, OrdersReportPointDto>();

    for (const row of data ?? []) {
      const bucket = this.getTimeBucket(row.created_at as string, query.groupBy);
      const key = bucket;

      if (!groups.has(key)) {
        groups.set(key, {
          date: bucket,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          revenue: 0,
        });
      }

      const point = groups.get(key)!;
      point.totalOrders += 1;

      const status = row.status as string;
      if (['delivered', 'shipping'].includes(status)) {
        point.completedOrders += 1;
      } else if (['pending', 'approved', 'processing'].includes(status)) {
        point.pendingOrders += 1;
      }

      if (row.total_amount != null) {
        point.revenue += Number(row.total_amount);
      }
    }

    const points = Array.from(groups.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return { points };
  }

  // Production report -------------------------------------------------------

  async getProductionReport(
    query: ReportQueryDto,
  ): Promise<ProductionReportDto> {
    let dbQuery = this.client
      .from('production_details')
      .select(
        `
        created_at,
        quantity_planned,
        quantity_produced,
        items:items!inner(name)
      `,
      )
      .gte('created_at', query.dateFrom)
      .lte('created_at', this.toEndOfDay(query.dateTo));

    if (query.search) {
      dbQuery = dbQuery.ilike('items.name', `%${query.search}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException('Failed to load production report');
    }

    const groups = new Map<string, ProductionReportPointDto>();

    for (const row of data ?? []) {
      const bucket = this.getTimeBucket(row.created_at as string, query.groupBy);
      const productName = (row.items as any)?.name ?? 'Unknown';
      const key = `${bucket}::${productName}`;

      if (!groups.has(key)) {
        groups.set(key, {
          date: bucket,
          productName,
          quantityPlanned: 0,
          quantityProduced: 0,
        });
      }

      const point = groups.get(key)!;
      point.quantityPlanned += Number(row.quantity_planned ?? 0);
      point.quantityProduced += Number(row.quantity_produced ?? 0);
    }

    const points = Array.from(groups.values()).sort((a, b) => {
      if (a.date === b.date) return a.productName.localeCompare(b.productName);
      return a.date.localeCompare(b.date);
    });

    return { points };
  }

  // Inventory report --------------------------------------------------------

  async getInventoryReport(
    query: ReportQueryDto,
  ): Promise<InventoryReportDto> {
    let dbQuery = this.client
      .from('inventory')
      .select(
        `
        store_id,
        quantity,
        min_stock_level,
        items:items!inner(id,name),
        stores:stores!inner(name)
      `,
      );

    if (query.storeId) {
      dbQuery = dbQuery.eq('store_id', query.storeId);
    }

    if (query.search) {
      dbQuery = dbQuery.ilike('items.name', `%${query.search}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException('Failed to load inventory report');
    }

    const rows: InventoryReportRowDto[] = (data ?? []).map((row: any) => ({
      itemId: row.items.id,
      itemName: row.items.name,
      storeId: row.store_id,
      storeName: row.stores?.name ?? null,
      quantity: Number(row.quantity ?? 0),
      minStockLevel:
        row.min_stock_level != null ? Number(row.min_stock_level) : null,
      isLowStock:
        row.min_stock_level != null &&
        Number(row.quantity ?? 0) < Number(row.min_stock_level),
    }));

    return { rows };
  }

  // Delivery report ---------------------------------------------------------

  async getDeliveryReport(
    query: ReportQueryDto,
  ): Promise<DeliveryReportDto> {
    let dbQuery = this.client
      .from('shipments')
      .select('created_at,status,shipped_date,delivered_date')
      .gte('created_at', query.dateFrom)
      .lte('created_at', this.toEndOfDay(query.dateTo));

    const { data, error } = await dbQuery;

    if (error) {
      throw new InternalServerErrorException('Failed to load delivery report');
    }

    const groups = new Map<string, DeliveryReportPointDto & { totalDuration: number; deliveredCount: number }>();

    for (const row of data ?? []) {
      const bucket = this.getTimeBucket(row.created_at as string, query.groupBy);

      if (!groups.has(bucket)) {
        groups.set(bucket, {
          date: bucket,
          totalShipments: 0,
          deliveredShipments: 0,
          failedShipments: 0,
          averageDeliveryTimeMinutes: null,
          totalDuration: 0,
          deliveredCount: 0,
        });
      }

      const point = groups.get(bucket)!;
      point.totalShipments += 1;

      const status = row.status as string;
      if (status === 'delivered') {
        point.deliveredShipments += 1;
      }
      if (status === 'failed') {
        point.failedShipments += 1;
      }

      if (row.shipped_date && row.delivered_date) {
        const shipped = new Date(row.shipped_date as string).getTime();
        const delivered = new Date(row.delivered_date as string).getTime();
        const minutes = (delivered - shipped) / (1000 * 60);
        if (!Number.isNaN(minutes) && minutes >= 0) {
          point.totalDuration += minutes;
          point.deliveredCount += 1;
        }
      }
    }

    const points: DeliveryReportPointDto[] = [];

    for (const value of groups.values()) {
      const avg =
        value.deliveredCount > 0
          ? value.totalDuration / value.deliveredCount
          : null;
      points.push({
        date: value.date,
        totalShipments: value.totalShipments,
        deliveredShipments: value.deliveredShipments,
        failedShipments: value.failedShipments,
        averageDeliveryTimeMinutes: avg,
      });
    }

    points.sort((a, b) => a.date.localeCompare(b.date));

    return { points };
  }

  // Export ------------------------------------------------------------------

  async exportReport(
    query: ReportQueryDto,
    format: 'csv' | 'pdf',
  ): Promise<Buffer> {
    if (format === 'pdf') {
      throw new InternalServerErrorException(
        'PDF export is not implemented yet. Please use CSV.',
      );
    }

    let dataset: unknown;

    switch (query.type) {
      case ReportType.ORDERS:
        dataset = (await this.getOrdersReport(query)).points;
        break;
      case ReportType.PRODUCTION:
        dataset = (await this.getProductionReport(query)).points;
        break;
      case ReportType.INVENTORY:
        dataset = (await this.getInventoryReport(query)).rows;
        break;
      case ReportType.DELIVERY:
        dataset = (await this.getDeliveryReport(query)).points;
        break;
      default:
        dataset = [];
    }

    const csv = this.toCsv(dataset as any[]);
    return Buffer.from(csv, 'utf-8');
  }

  // Helpers -----------------------------------------------------------------

  private getTimeBucket(
    isoDate: string,
    groupBy: ReportGroupBy = ReportGroupBy.DAY,
  ): string {
    const d = new Date(isoDate);

    if (Number.isNaN(d.getTime())) {
      return isoDate.slice(0, 10);
    }

    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');

    if (groupBy === ReportGroupBy.MONTH) {
      return `${year}-${month}`;
    }

    if (groupBy === ReportGroupBy.WEEK) {
      const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
      const pastDaysOfYear =
        (d.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000);
      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7)
        .toString()
        .padStart(2, '0');
      return `${year}-W${week}`;
    }

    return `${year}-${month}-${day}`;
  }

  private toCsv(rows: any[]): string {
    if (!rows.length) return '';

    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const value = row[h];
        if (value == null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }
}

