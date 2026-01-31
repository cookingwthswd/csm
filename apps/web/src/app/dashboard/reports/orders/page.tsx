'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useOrdersReport } from '@/features/reports/hooks/use-report';
import { ReportFilters, ChartContainer, ExportButton } from '@/features/reports/components';
import type { ReportQuery } from '@/lib/api/reports';

const LineChart = dynamic(
  () => import('recharts').then((m) => m.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
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

export default function OrdersReportPage() {
  const [query, setQuery] = useState<ReportQuery>({
    ...defaultRange(),
    groupBy: 'day',
  });

  const { data, isLoading, isError, error } = useOrdersReport(query);
  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((s) => ({
        name: s.date,
        total: s.total,
        completed: s.completed,
        revenue: s.revenue,
      })),
    [data?.series]
  );

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders Report</h1>
        <p className="mt-2 text-red-600">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Orders Report</h1>
        <ExportButton query={{ ...query, type: 'orders' }} />
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
              <p className="text-sm text-gray-500">Total orders</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.total}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-emerald-600">{data.summary.completed}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-xl font-bold text-gray-600">{data.summary.cancelled}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-gray-800">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(data.summary.revenue)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <ChartContainer title="Orders by period">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}
