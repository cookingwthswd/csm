"use client";

import type { InventoryReport } from '@repo/types';
import { useReport } from '../hooks/use-report';
import { ReportFilters, ExportButton } from '../components';

export function InventoryReportPage() {
  const { query, setQuery, data, isLoading, error } = useReport('inventory');
  const report = data as InventoryReport | undefined;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Report
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor stock levels, movements, and low-stock alerts.
          </p>
        </div>
        <ExportButton type="inventory" query={query} />
      </header>

      <ReportFilters
        query={query}
        onChange={setQuery}
        showGroupBy={false}
      />

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message || 'Failed to load report'}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        {isLoading || !report ? (
          <div className="p-4 text-xs text-gray-400">Loading inventory...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Item
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Store
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Quantity
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Min Level
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={`${row.storeId}-${row.itemId}`} className="border-t">
                  <td className="px-3 py-2 text-gray-900">{row.itemName}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {row.storeName ?? `Store #${row.storeId}`}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {row.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {row.minStockLevel ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.isLowStock ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

