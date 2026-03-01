"use client";

import dynamic from 'next/dynamic';
import { useDashboard } from '../hooks/use-dashboard';
import { StatCard, ChartContainer } from '../components';

const TimeSeriesChart = dynamic(
  () =>
    import('../components/time-series-chart').then(
      (m) => m.TimeSeriesChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-gray-400">
        Loading chart...
      </div>
    ),
  },
);

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardReportsPage() {
  const {
    overview,
    overviewLoading,
    overviewError,
    ordersReport,
    ordersLoading,
    productionReport,
    productionLoading,
  } = useDashboard();

  if (overviewLoading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  if (overviewError) {
    return (
      <div className="rounded bg-red-50 p-3 text-sm text-red-700">
        {(overviewError as Error).message || 'Failed to load dashboard'}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time overview of orders, inventory, production, and deliveries.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={overview.totalOrders}
          trend="+12%"
        />
        <StatCard
          title="Pending"
          value={overview.pendingOrders}
          status="warning"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(overview.totalRevenue)}
        />
        <StatCard
          title="Low Stock"
          value={overview.lowStockItems}
          status={overview.lowStockItems > 0 ? 'danger' : 'default'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Orders by Period">
          {ordersLoading || !ordersReport ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Loading chart...
            </div>
          ) : (
            <TimeSeriesChart
              data={ordersReport.points}
              xKey="date"
              series={[
                {
                  dataKey: 'totalOrders',
                  name: 'Total Orders',
                  color: '#2563EB',
                },
                {
                  dataKey: 'completedOrders',
                  name: 'Completed',
                  color: '#16A34A',
                },
                {
                  dataKey: 'pendingOrders',
                  name: 'Pending',
                  color: '#F97316',
                },
              ]}
            />
          )}
        </ChartContainer>

        <ChartContainer title="Production by Product">
          {productionLoading || !productionReport ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Loading chart...
            </div>
          ) : (
            <TimeSeriesChart
              data={productionReport.points}
              xKey="date"
              series={[
                {
                  dataKey: 'quantityProduced',
                  name: 'Produced',
                  color: '#22C55E',
                  type: 'bar',
                },
              ]}
            />
          )}
        </ChartContainer>
      </section>
    </div>
  );
}

