'use client';

import { useState } from 'react';
import { useInventoryReport } from '@/features/reports/hooks/use-report';
import { ReportFilters, ExportButton } from '@/features/reports/components';
import type { ReportQuery } from '@/lib/api/reports';

export default function InventoryReportPage() {
  const [query, setQuery] = useState<ReportQuery>({ groupBy: 'day' });

  const { data, isLoading, isError, error } = useInventoryReport(query);

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Inventory Report</h1>
        <p className="mt-2 text-red-600">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Report</h1>
        <ExportButton query={{ ...query, type: 'inventory' }} />
      </div>

      <div className="mt-6">
        <ReportFilters query={query} onQueryChange={setQuery} showGroupBy={false} />
      </div>

      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-lg border bg-gray-100" />
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total items</p>
              <p className="text-xl font-bold text-gray-800">{data.summary.totalItems}</p>
            </div>
            <div className="rounded-lg border bg-amber-50 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Low stock</p>
              <p className="text-xl font-bold text-amber-700">{data.summary.lowStockCount}</p>
            </div>
            <div className="rounded-lg border bg-red-50 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Out of stock</p>
              <p className="text-xl font-bold text-red-700">{data.summary.outOfStockCount}</p>
            </div>
          </div>

          {data.alerts && data.alerts.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">Active alerts</h2>
              <ul className="space-y-2">
                {data.alerts.map((a) => (
                  <li
                    key={a.id}
                    className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-gray-700"
                  >
                    {a.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Item</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Min level</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((i) => (
                  <tr key={`${i.itemId}-${i.storeId ?? 0}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{i.itemName}</td>
                    <td className="px-4 py-2 text-right">{i.quantity}</td>
                    <td className="px-4 py-2 text-right">{i.minStockLevel}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={
                          i.status === 'out'
                            ? 'rounded bg-red-100 px-2 py-0.5 text-red-700'
                            : i.status === 'low'
                              ? 'rounded bg-amber-100 px-2 py-0.5 text-amber-700'
                              : 'rounded bg-gray-100 px-2 py-0.5 text-gray-600'
                        }
                      >
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
