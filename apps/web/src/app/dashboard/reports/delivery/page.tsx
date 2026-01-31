'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDeliveryReport } from '@/features/reports/hooks/use-report';
import { ReportFilters, ChartContainer, ExportButton } from '@/features/reports/components';
import type { ReportQuery } from '@/lib/api/reports';

const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);

const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
};

export default function DeliveryReportPage() {
  const [query, setQuery] = useState<ReportQuery>({
    ...defaultRange(),
    groupBy: 'day',
  });

  const { data, isLoading, isError, error } = useDeliveryReport(query);
  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((s) => ({
        name: s.date,
        total: s.total,
        delivered: s.delivered,
        failed: s.failed,
        avgHours: s.avgDeliveryHours,
      })),
    [data?.series]
  );

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Delivery Report</h1>
        <p className="mt-2 text-red-600">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Delivery Report</h1>
        <ExportButton query={{ ...query, type: 'delivery' }} />
      </div>

      <div className="mt-6">
        <ReportFilters query={query} onQueryChange={setQuery} showStoreFilter={false} />
      </div>

      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-lg border bg-gray-100" />
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total shipments</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.total}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-xl font-bold text-emerald-600">{data.summary.delivered}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-red-600">{data.summary.failed}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Success rate</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.successRate}%</p>
            </div>
          </div>

          <div className="mt-8">
            <ChartContainer title="Delivery by period">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}
