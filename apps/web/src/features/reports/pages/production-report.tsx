"use client";

import dynamic from 'next/dynamic';
import type { ProductionReport } from '@repo/types';
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

export function ProductionReportPage() {
  const { query, setQuery, data, isLoading, error } = useReport('production');
  const report = data as ProductionReport | undefined;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Production Report
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track batch completion and product output across time.
          </p>
        </div>
        <ExportButton type="production" query={query} />
      </header>

      <ReportFilters query={query} onChange={setQuery} />

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message || 'Failed to load report'}
        </div>
      )}

      <ChartContainer title="Production by Product">
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
                dataKey: 'quantityPlanned',
                name: 'Planned',
                color: '#A855F7',
              },
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
    </div>
  );
}

