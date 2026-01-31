'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useProductionReport } from '@/features/reports/hooks/use-report';
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

export default function ProductionReportPage() {
  const [query, setQuery] = useState<ReportQuery>({
    ...defaultRange(),
    groupBy: 'day',
  });

  const { data, isLoading, isError, error } = useProductionReport(query);
  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((s) => ({
        name: s.date,
        planned: s.planned,
        produced: s.produced,
        batches: s.batches,
      })),
    [data?.series]
  );

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Production Report</h1>
        <p className="mt-2 text-red-600">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Production Report</h1>
        <ExportButton query={{ ...query, type: 'production' }} />
      </div>

      <div className="mt-6">
        <ReportFilters query={query} onQueryChange={setQuery} showStoreFilter={false} />
      </div>

      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-lg border bg-gray-100" />
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total planned</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.totalPlanned}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total produced</p>
              <p className="text-xl font-bold text-emerald-600">{data.summary.totalProduced}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Plans completed</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.plansCompleted}</p>
            </div>
          </div>

          <div className="mt-8">
            <ChartContainer title="Production by period">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="planned" fill="#94a3b8" name="Planned" />
                  <Bar dataKey="produced" fill="#3b82f6" name="Produced" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}
