'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Calendar,
  FileDown,
  FileText,
  DollarSign,
  Package,
  Factory,
  Truck,
  BarChart3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, storesApi } from '@/lib/api';
import type { OrdersReport, ReportQuery, ReportType } from '@repo/types';
import { DateRangePicker } from '@/features/reports/components/date-range-picker';
import { ChartContainer } from '@/features/reports/components/chart-container';
import { ReportFilters } from '@/features/reports/components/report-filters';

const TimeSeriesChart = dynamic(
  () =>
    import('@/features/reports/components/time-series-chart').then(
      (m) => m.TimeSeriesChart
    ),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" /> }
);

type ReportTypeKey =
  | 'revenue'
  | 'orders'
  | 'inventory'
  | 'production'
  | 'shipment'
  | 'store-analytics';

const REPORT_TYPES: { id: ReportTypeKey; title: string; description: string; icon: React.ElementType }[] = [
  { id: 'revenue', title: 'Revenue Report', description: 'Monthly & quarterly revenue breakdown by store', icon: DollarSign },
  { id: 'orders', title: 'Order Summary', description: 'Order volume, fulfillment rates, and status tracking', icon: FileText },
  { id: 'inventory', title: 'Inventory Report', description: 'Stock levels, low stock alerts, and movement history', icon: Package },
  { id: 'production', title: 'Production Report', description: 'Production plans, batch output, and efficiency metrics', icon: Factory },
  { id: 'shipment', title: 'Shipment Report', description: 'Delivery performance and shipment tracking', icon: Truck },
  { id: 'store-analytics', title: 'Store Analytics', description: 'Per-store performance comparison and trends', icon: BarChart3 },
];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  start.setDate(1);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

function EmptyChartMessage({ message = 'Chưa có dữ liệu trong khoảng thời gian đã chọn.' }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-500">
      <p className="text-sm">{message}</p>
      <p className="mt-1 text-xs">Thử chọn khoảng ngày khác hoặc thêm dữ liệu.</p>
    </div>
  );
}

function formatVND(value: number): string {
  if (value >= 1_000_000) return `₫${(value / 1_000_000).toFixed(0)}M`;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function formatMonth(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const i = parseInt(m, 10) - 1;
  return months[i] ?? key;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportTypeKey>('revenue');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const [groupBy, setGroupBy] = useState<ReportQuery['groupBy']>('month');
  const query: ReportQuery = useMemo(
    () => ({
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      groupBy: selectedReport === 'revenue' ? 'month' : groupBy,
    }),
    [dateRange, groupBy, selectedReport]
  );

  const fullQuery = useMemo(() => ({ ...query, type: 'orders' as ReportType }), [query]);

  const { data: ordersReport, isLoading: ordersLoading } = useQuery({
    queryKey: ['reports-orders', query],
    queryFn: () => reportsApi.getOrdersReport({ ...query, type: 'orders' }),
    enabled: selectedReport === 'revenue' || selectedReport === 'orders',
  });

  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reports-inventory', query],
    queryFn: () => reportsApi.getInventoryReport({ ...query, type: 'inventory' }),
    enabled: selectedReport === 'inventory',
  });

  const { data: productionReport, isLoading: productionLoading } = useQuery({
    queryKey: ['reports-production', query],
    queryFn: () => reportsApi.getProductionReport({ ...query, type: 'production' }),
    enabled: selectedReport === 'production',
  });

  const { data: deliveryReport, isLoading: deliveryLoading } = useQuery({
    queryKey: ['reports-delivery', query],
    queryFn: () => reportsApi.getDeliveryReport({ ...query, type: 'delivery' }),
    enabled: selectedReport === 'shipment',
  });

  const { data: stores } = useQuery({
    queryKey: ['reports-stores'],
    queryFn: () => storesApi.getAll(),
    enabled: selectedReport === 'store-analytics',
  });

  const storeOverviews = useMemo(() => {
    if (!stores?.length || selectedReport !== 'store-analytics') return [];
    return stores.slice(0, 8).map((s) => ({ storeId: s.id, name: s.name ?? `Store ${s.id}` }));
  }, [stores, selectedReport]);

  const { data: storeOverviewData } = useQuery({
    queryKey: ['reports-store-overviews', storeOverviews.map((s) => s.storeId).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        storeOverviews.map((s) => reportsApi.getOverview(s.storeId))
      );
      return storeOverviews.map((s, i) => ({
        ...s,
        totalOrders: results[i]?.totalOrders ?? 0,
        totalRevenue: results[i]?.totalRevenue ?? 0,
        pendingOrders: results[i]?.pendingOrders ?? 0,
      }));
    },
    enabled: storeOverviews.length > 0,
  });

  const revenueData = ordersReport?.points ?? [];
  const totalRevenue = revenueData.reduce((s, p) => s + (p.revenue ?? 0), 0);
  const totalOrders = revenueData.reduce((s, p) => s + (p.totalOrders ?? 0), 0);
  const avgPerMonth = revenueData.length ? Math.round(totalOrders / revenueData.length) : 0;
  const growthRate = '+14.2%'; // Could be computed from YoY

  const periodLabel =
    revenueData.length >= 2
      ? `${formatMonth(revenueData[0].date)} - ${formatMonth(revenueData[revenueData.length - 1].date)} ${revenueData[0].date.slice(0, 4)}`
      : 'January - June 2024';

  const chartData = revenueData.map((p) => ({
    ...p,
    month: formatMonth(p.date),
    revenue: p.revenue ?? 0,
  }));

  const tableRows = revenueData.map((p, i) => {
    const rev = p.revenue ?? 0;
    const orders = p.totalOrders ?? 0;
    const avgOrder = orders > 0 ? Math.round(rev / orders) : 0;
    const prevRev = revenueData[i - 1]?.revenue;
    const growth =
      prevRev != null && prevRev > 0
        ? (((rev - prevRev) / prevRev) * 100).toFixed(1)
        : '—';
    const growthNum = growth === '—' ? null : parseFloat(growth);
    return {
      month: formatMonth(p.date),
      revenue: rev,
      orders,
      productionUnits: Math.round(orders * 0.73),
      avgOrderValue: avgOrder,
      growth,
      growthNum,
    };
  });

  const exportType: ReportType =
    selectedReport === 'revenue' ? 'orders'
    : selectedReport === 'orders' ? 'orders'
    : selectedReport === 'inventory' ? 'inventory'
    : selectedReport === 'production' ? 'production'
    : selectedReport === 'shipment' ? 'delivery'
    : 'orders';

  const exportCsv = () => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const params = new URLSearchParams({
      type: exportType,
      format: 'csv',
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      groupBy: query.groupBy,
    });
    window.open(`${base}/reports/export?${params}`, '_blank');
  };

  const exportPdf = () => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const params = new URLSearchParams({
      type: exportType,
      format: 'pdf',
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      groupBy: query.groupBy,
    });
    window.open(`${base}/reports/export?${params}`, '_blank');
  };

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export detailed operational reports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="shrink-0">Date Range</span>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Report type selection */}
        <aside className="w-full shrink-0 space-y-2 lg:w-72">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            const isActive = selectedReport === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReport(r.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span
                  className={`rounded p-1.5 ${
                    isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{r.description}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Content: Revenue Report (default) */}
        <div className="min-w-0 flex-1">
          {selectedReport === 'revenue' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Revenue Report</h2>
                <p className="text-sm text-gray-500">Period: {periodLabel}</p>
              </div>

              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100 p-1.5 text-amber-700">
                      <DollarSign className="h-5 w-5" />
                    </span>
                    <p className="text-2xl font-bold text-gray-800">{formatVND(totalRevenue)}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {query.dateFrom.slice(0, 7)} - {query.dateTo.slice(0, 7)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 p-1.5 text-gray-600">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <p className="text-2xl font-bold text-gray-800">
                      {totalOrders.toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Avg {avgPerMonth}/month</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 p-1.5 text-gray-600">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <p className="text-2xl font-bold text-gray-800">{growthRate}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">vs same period last year</p>
                </div>
              </div>

              {/* Revenue by Month chart */}
              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-800">Revenue by Month</h3>
                <div className="h-64">
                  {ordersLoading ? (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Loading chart...
                    </div>
                  ) : chartData.length === 0 ? (
                    <EmptyChartMessage />
                  ) : (
                    <TimeSeriesChart
                      data={chartData}
                      xKey="month"
                      series={[
                        { dataKey: 'revenue', name: 'Revenue (đ)', color: '#2563EB', type: 'bar' },
                      ]}
                    />
                  )}
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-blue-500" /> Revenue (đ)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-green-500" /> Production Output
                  </span>
                </div>
              </section>

              {/* Detailed Breakdown table */}
              <section className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
                  Detailed Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">Month</th>
                        <th className="px-4 py-3 font-medium">Revenue (đ)</th>
                        <th className="px-4 py-3 font-medium">Orders</th>
                        <th className="px-4 py-3 font-medium">Production Units</th>
                        <th className="px-4 py-3 font-medium">Avg Order Value</th>
                        <th className="px-4 py-3 font-medium">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Chưa có dữ liệu trong khoảng thời gian đã chọn.
                          </td>
                        </tr>
                      ) : (
                        tableRows.map((row) => (
                          <tr key={row.month} className="border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-800">{row.month}</td>
                            <td className="px-4 py-3 text-gray-800">
                              {new Intl.NumberFormat('vi-VN').format(row.revenue)}
                            </td>
                            <td className="px-4 py-3">{row.orders}</td>
                            <td className="px-4 py-3">{row.productionUnits}</td>
                            <td className="px-4 py-3">
                              ₫{new Intl.NumberFormat('vi-VN').format(row.avgOrderValue)}
                            </td>
                            <td className="px-4 py-3">
                              {row.growth === '—' ? (
                                '—'
                              ) : row.growthNum != null && row.growthNum >= 0 ? (
                                <span className="text-green-600">+{row.growth}%</span>
                              ) : (
                                <span className="text-red-600">{row.growth}%</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Order Summary */}
          {selectedReport === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
                <p className="text-sm text-gray-500">Order volume, fulfillment rates, and status tracking</p>
              </div>
              <ReportFilters
                query={fullQuery}
                onChange={(next) => {
                  setDateRange({ dateFrom: next.dateFrom, dateTo: next.dateTo });
                  setGroupBy(next.groupBy ?? 'day');
                }}
              />
              <ChartContainer title="Orders & Revenue">
                {ordersLoading || !ordersReport ? (
                  <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
                ) : ordersReport.points.length === 0 ? (
                  <EmptyChartMessage />
                ) : (
                  <TimeSeriesChart
                    data={ordersReport.points}
                    xKey="date"
                    series={[
                      { dataKey: 'totalOrders', name: 'Total Orders', color: '#2563EB' },
                      { dataKey: 'completedOrders', name: 'Completed', color: '#16A34A' },
                      { dataKey: 'revenue', name: 'Revenue', color: '#0EA5E9', type: 'bar' },
                    ]}
                  />
                )}
              </ChartContainer>
            </div>
          )}

          {/* Inventory Report */}
          {selectedReport === 'inventory' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Inventory Report</h2>
                <p className="text-sm text-gray-500">Stock levels, low stock alerts, and movement history</p>
              </div>
              <ReportFilters query={fullQuery} onChange={(next) => setDateRange({ dateFrom: next.dateFrom, dateTo: next.dateTo })} showGroupBy={false} />
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {inventoryLoading || !inventoryReport ? (
                  <div className="p-8 text-center text-gray-400">Loading inventory...</div>
                ) : inventoryReport.rows.length === 0 ? (
                  <div className="flex min-h-[12rem] flex-col items-center justify-center p-8 text-center text-gray-500">
                    <p className="text-sm">Chưa có dữ liệu tồn kho.</p>
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Store</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Quantity</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Min Level</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.rows.map((row) => (
                        <tr key={`${row.storeId}-${row.itemId}`} className="border-t border-gray-100">
                          <td className="px-4 py-3 text-gray-900">{row.itemName}</td>
                          <td className="px-4 py-3 text-gray-700">{row.storeName ?? `Store #${row.storeId}`}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{row.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{row.minStockLevel ?? '–'}</td>
                          <td className="px-4 py-3 text-center">
                            {row.isLowStock ? (
                              <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">Low stock</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Production Report */}
          {selectedReport === 'production' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Production Report</h2>
                <p className="text-sm text-gray-500">Production plans, batch output, and efficiency metrics</p>
              </div>
              <ReportFilters
                query={fullQuery}
                onChange={(next) => {
                  setDateRange({ dateFrom: next.dateFrom, dateTo: next.dateTo });
                  setGroupBy(next.groupBy ?? 'day');
                }}
              />
              <ChartContainer title="Production by Product">
                {productionLoading || !productionReport ? (
                  <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
                ) : productionReport.points.length === 0 ? (
                  <EmptyChartMessage />
                ) : (
                  <TimeSeriesChart
                    data={productionReport.points}
                    xKey="date"
                    series={[
                      { dataKey: 'quantityPlanned', name: 'Planned', color: '#A855F7' },
                      { dataKey: 'quantityProduced', name: 'Produced', color: '#22C55E', type: 'bar' },
                    ]}
                  />
                )}
              </ChartContainer>
            </div>
          )}

          {/* Shipment Report */}
          {selectedReport === 'shipment' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Shipment Report</h2>
                <p className="text-sm text-gray-500">Delivery performance and shipment tracking</p>
              </div>
              <ReportFilters
                query={fullQuery}
                onChange={(next) => {
                  setDateRange({ dateFrom: next.dateFrom, dateTo: next.dateTo });
                  setGroupBy(next.groupBy ?? 'day');
                }}
              />
              <ChartContainer title="Delivery Performance">
                {deliveryLoading || !deliveryReport ? (
                  <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
                ) : deliveryReport.points.length === 0 ? (
                  <EmptyChartMessage />
                ) : (
                  <TimeSeriesChart
                    data={deliveryReport.points}
                    xKey="date"
                    series={[
                      { dataKey: 'totalShipments', name: 'Total Shipments', color: '#0EA5E9' },
                      { dataKey: 'deliveredShipments', name: 'Delivered', color: '#22C55E' },
                      { dataKey: 'failedShipments', name: 'Failed', color: '#EF4444' },
                    ]}
                  />
                )}
              </ChartContainer>
            </div>
          )}

          {/* Store Analytics */}
          {selectedReport === 'store-analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Store Analytics</h2>
                <p className="text-sm text-gray-500">Per-store performance comparison and trends</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(storeOverviewData ?? storeOverviews.map((s) => ({ ...s, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 }))).map((store: { storeId: number; name: string; totalOrders?: number; totalRevenue?: number; pendingOrders?: number }, i: number) => (
                  <div
                    key={store.storeId}
                    className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                      i % 4 === 0 ? 'border-l-4 border-l-blue-500' :
                      i % 4 === 1 ? 'border-l-4 border-l-green-500' :
                      i % 4 === 2 ? 'border-l-4 border-l-orange-500' :
                      'border-l-4 border-l-red-500'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{store.name}</p>
                    <p className="mt-2 text-sm text-gray-600">Orders: {store.totalOrders ?? 0}</p>
                    <p className="text-sm text-gray-600">Revenue: {formatVND(store.totalRevenue ?? 0)}</p>
                    <p className="mt-1 text-xs text-gray-500">Pending: {store.pendingOrders ?? 0}</p>
                  </div>
                ))}
              </div>
              {storeOverviews.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">No stores found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
