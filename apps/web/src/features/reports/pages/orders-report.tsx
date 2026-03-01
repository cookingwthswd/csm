"use client";

import dynamic from 'next/dynamic';
import type { OrdersReport } from '@repo/types';
import { useReport } from '../hooks/use-report';
import { ChartContainer, ReportFilters, ExportButton } from '../components';

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

export function OrdersReportPage() {
  const { query, setQuery, data, isLoading, error } = useReport('orders');
  const report = data as OrdersReport | undefined;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze order volume, status breakdowns, and revenue over time.
          </p>
        </div>
        <ExportButton type="orders" query={query} />
      </header>

      <ReportFilters query={query} onChange={setQuery} />

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message || 'Failed to load report'}
        </div>
      )}

      <ChartContainer title="Orders & Revenue">
        {isLoading || !report ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Loading chart...
          </div>
        ) : (
          <TimeSeriesChart
            data={report.points}
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
                dataKey: 'revenue',
                name: 'Revenue',
                color: '#0EA5E9',
                type: 'bar',
              },
            ]}
          />
        )}
      </ChartContainer>
    </div>
  );
}

