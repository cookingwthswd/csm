'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Package,
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  categoriesApi,
  productsApi,
  reportsApi,
  storesApi,
} from '@/lib/api';
import { orderApi } from '@/lib/api/orders';
import type { OrderResponse } from '@repo/types';

const RevenueOrdersChart = dynamic(
  () =>
    import('@/features/reports/components/time-series-chart').then(
      (m) => m.TimeSeriesChart
    ),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-gray-100" /> }
);

const SalesByCategoryChart = dynamic(
  () =>
    import('./components/dashboard-charts').then((m) => ({
      default: m.SalesByCategoryChart,
    })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-gray-100" /> }
);

const InventoryLevelsChart = dynamic(
  () =>
    import('./components/dashboard-charts').then((m) => ({
      default: m.InventoryLevelsChart,
    })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-gray-100" /> }
);

type TabId = 'operations' | 'finance' | 'inventory' | 'store-performance';

const TABS: { id: TabId; label: string }[] = [
  { id: 'operations', label: 'Operations' },
  { id: 'finance', label: 'Finance' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'store-performance', label: 'Store Performance' },
];

function formatVND(value: number): string {
  if (value >= 1_000_000) return `₫${(value / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'shipping') return 'bg-green-100 text-green-800';
  if (s === 'in transit' || s === 'shipping') return 'bg-blue-100 text-blue-800';
  if (s === 'processing' || s === 'approved' || s === 'processed')
    return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('operations');

  useQuery({
    queryKey: ['dashboard-categories-count'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['dashboard-stores'],
    queryFn: () => storesApi.getAll(),
  });

  const { data: productsResp } = useQuery({
    queryKey: ['dashboard-products-count'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 1 }),
  });

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => reportsApi.getOverview(),
  });

  const { data: ordersReport } = useQuery({
    queryKey: ['dashboard-orders-report-monthly'],
    queryFn: () =>
      reportsApi.getOrdersReport({
        dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
        dateTo: new Date().toISOString().slice(0, 10),
        groupBy: 'month',
      }),
  });

  const { data: recentOrdersResp } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: () => orderApi.getAll({ page: 1, limit: 5 }),
  });

  const storeOverviews = useMemo(() => {
    if (!stores?.length) return [];
    return stores.slice(0, 4).map((s) => ({
      storeId: s.id,
      name: s.name ?? `Store ${String.fromCharCode(64 + s.id)}`,
      orders: 0,
      revenue: 0,
      satisfaction: 4.5,
    }));
  }, [stores]);

  const storeOverviewQueries = useQuery({
    queryKey: ['dashboard-store-overviews', storeOverviews.map((s) => s.storeId)],
    queryFn: async () => {
      const results = await Promise.all(
        storeOverviews.map((s) => reportsApi.getOverview(s.storeId))
      );
      return storeOverviews.map((s, i) => ({
        ...s,
        orders: results[i]?.totalOrders ?? 0,
        revenue: results[i]?.totalRevenue ?? 0,
        satisfaction: 4.3 + (i % 4) * 0.2,
      }));
    },
    enabled: storeOverviews.length > 0,
  });

  const storeStats = storeOverviewQueries.data ?? storeOverviews;

  const chartData = useMemo(() => {
    const points = ordersReport?.points ?? [];
    return points.map((p) => ({
      date: p.date,
      month: new Date(p.date + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: p.revenue ?? 0,
      totalOrders: p.totalOrders ?? 0,
    }));
  }, [ordersReport]);

  const totalProducts = productsResp?.meta?.total ?? 0;
  const totalStores = stores?.length ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const revenue = overview?.totalRevenue ?? 0;

  const ordersTrend = '+12%';
  const revenueTrend = '-8.2%';
  const productsSub = '12 added this month';
  const storesSub = 'All stores operational';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to CKMS - Central Kitchen Management System
          </p>
          <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Net Worth</span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </button>
        </div>
      </header>

      {/* Row 1: Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3.5 w-3.5" />
                {ordersTrend} vs last month
              </p>
            </div>
            <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <FileText className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatVND(revenue)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <TrendingDown className="h-3.5 w-3.5" />
                {revenueTrend} vs last month
              </p>
            </div>
            <span className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Products</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalProducts}</p>
              <p className="mt-1 text-xs text-gray-500">{productsSub}</p>
            </div>
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Stores</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {storesLoading ? '...' : totalStores}
              </p>
              <p className="mt-1 text-xs text-gray-500">{storesSub}</p>
            </div>
            <span className="rounded-lg bg-violet-100 p-2 text-violet-600">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Revenue & Orders Trend + Sales by Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Revenue & Orders Trend</h3>
            <select className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
              <option>Monthly</option>
            </select>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <RevenueOrdersChart
                data={chartData}
                xKey="month"
                series={[
                  { dataKey: 'revenue', name: 'Revenue (₫)', color: '#2563EB' },
                ]}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data for selected period
              </div>
            )}
          </div>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Sales by Category</h3>
          <div className="h-64">
            <SalesByCategoryChart />
          </div>
        </section>
      </div>

      {/* Row 3: Inventory Levels + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Inventory Levels</h3>
          <div className="h-64">
            <InventoryLevelsChart />
          </div>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
            Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Order ID</th>
                  <th className="px-4 py-2 font-medium">Store</th>
                  <th className="px-4 py-2 font-medium">Items</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrdersResp?.data ?? []).map((order: OrderResponse) => (
                  (() => {
                    const orderStatus =
                      typeof order.status === 'string' ? order.status : 'unknown';

                    return (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="px-4 py-2">
                          <Link
                            href={`/dashboard/orders`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {order.storeName ?? `Store ${order.storeId}`}
                        </td>
                        <td className="px-4 py-2">{order.items?.length ?? 0}</td>
                        <td className="px-4 py-2">
                          {order.totalAmount != null
                            ? formatVND(order.totalAmount)
                            : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                              orderStatus
                            )}`}
                          >
                            {orderStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })()
                ))}
                {!recentOrdersResp?.data?.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Row 4: Store Performance Overview */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Store Performance Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { border: 'border-l-blue-500', name: 'Store A' },
            { border: 'border-l-green-500', name: 'Store B' },
            { border: 'border-l-orange-500', name: 'Store C' },
            { border: 'border-l-red-500', name: 'Store D' },
          ].map((style, i) => {
            const s = storeStats[i];
            const name = s?.name ?? style.name;
            const orders = s?.orders ?? 0;
            const rev = s?.revenue ?? 0;
            const sat = s?.satisfaction ?? 4.5;
            return (
              <div
                key={name}
                className={`rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm ${style.border}`}
              >
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="mt-1 text-sm text-gray-600">Orders: {orders}</p>
                <p className="text-sm text-gray-600">Revenue: {formatVND(rev)}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                  {sat.toFixed(1)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
