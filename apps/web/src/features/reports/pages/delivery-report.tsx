"use client";

import dynamic from 'next/dynamic';
import type { DeliveryReport } from '@repo/types';
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

export function DeliveryReportPage() {
  const { query, setQuery, data, isLoading, error } = useReport('delivery');
  const report = data as DeliveryReport | undefined;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Delivery Report
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor delivery times, success rate, and shipment volume.
          </p>
        </div>
        <ExportButton type="delivery" query={query} />
      </header>

      <ReportFilters query={query} onChange={setQuery} />

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message || 'Failed to load report'}
        </div>
      )}

      <ChartContainer title="Delivery Performance">
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
                dataKey: 'totalShipments',
                name: 'Total Shipments',
                color: '#0EA5E9',
              },
              {
                dataKey: 'deliveredShipments',
                name: 'Delivered',
                color: '#22C55E',
              },
              {
                dataKey: 'failedShipments',
                name: 'Failed',
                color: '#EF4444',
              },
            ]}
          />
        )}
      </ChartContainer>
    </div>
  );
}

