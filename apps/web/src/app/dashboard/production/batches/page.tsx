'use client';

import { Suspense } from 'react';
import { useProductionBatches } from '@/hooks/use-production';

function BatchesTable() {
  const { data: batchesData, isLoading, error } = useProductionBatches(1, 100);

  if (isLoading) return <div>Loading batches...</div>;
  if (error) return <div>Error loading batches.</div>;

  const batches = batchesData?.data || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Batch Code</th>
            <th className="px-6 py-3">Item</th>
            <th className="px-6 py-3">Mfr Date</th>
            <th className="px-6 py-3">Expiry Date</th>
            <th className="px-6 py-3">Quantity (Current/Initial)</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {batches.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No batches found.
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <tr key={batch.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {batch.batch_code}
                </td>
                <td className="px-6 py-4">
                  {(batch.items as any)?.name || `Item #${batch.item_id}`}
                </td>
                <td className="px-6 py-4">
                  {new Date(batch.manufacture_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {new Date(batch.expiry_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-mono">
                  {batch.current_quantity} / {batch.initial_quantity}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    batch.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : batch.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {batch.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function BatchesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Production Batches</h2>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Batch Tracking</h3>
        </div>
        <div className="p-0">
          <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
            <BatchesTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
