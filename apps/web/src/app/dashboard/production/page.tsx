'use client';

import { Suspense } from 'react';
import { useProductionPlans } from '@/hooks/use-production';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import Link from 'next/link';

function ProductionPlansTable() {
  const { data: plansData, isLoading, error } = useProductionPlans(1, 50);

  if (isLoading) return <div>Loading plans...</div>;
  if (error) return <div>Error loading plans.</div>;

  const plans = plansData?.data || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Plan Code</th>
            <th className="px-6 py-3">Period</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Created By</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No production plans found.
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr key={plan.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {plan.planCode || (plan as any).plan_code}
                </td>
                <td className="px-6 py-4">
                  {new Date(plan.startDate || (plan as any).start_date).toLocaleDateString()} -{' '}
                  {(plan.endDate || (plan as any).end_date) ? new Date(plan.endDate || (plan as any).end_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : plan.status === 'in_progress'
                      ? 'bg-green-100 text-green-800'
                      : plan.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(plan as any).users?.full_name || 'System'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/production/${plan.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium text-sm border border-blue-600 rounded px-3 py-1.5"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductionPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Production Plans</h2>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/production/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4 whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Plan
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Plans</h3>
        </div>
        <div className="p-0">
          <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
            <ProductionPlansTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
