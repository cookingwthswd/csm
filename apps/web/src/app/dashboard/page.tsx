'use client';

import Link from 'next/link';
import { useDashboard } from '@/features/reports/hooks/use-dashboard';
import { StatCard } from '@/features/reports/components/stat-card';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-2 text-gray-600">Loading overview...</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-2 text-red-600">
          {error instanceof Error ? error.message : 'Failed to load overview'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        CKMS - Central Kitchen Management System. Overview stats below.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard
          title="Pending"
          value={stats.pendingOrders}
          status={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
        <StatCard title="Completed" value={stats.completedOrders} status="success" />
        <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} />
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          status={stats.lowStockItems > 0 ? 'danger' : 'default'}
        />
        <StatCard
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          status={stats.pendingDeliveries > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Reports</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/reports/orders"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Orders Report
          </Link>
          <Link
            href="/dashboard/reports/production"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Production Report
          </Link>
          <Link
            href="/dashboard/reports/inventory"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Inventory Report
          </Link>
          <Link
            href="/dashboard/reports/delivery"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Delivery Report
          </Link>
        </div>
      </div>
    </div>
  );
}
