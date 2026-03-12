'use client';

import { useState } from 'react';
import { useProductionPlan, useUpdateProductionPlanStatus } from '@/hooks/use-production';
import { ArrowLeft, Play, CheckCircle, Ban } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import MaterialCalculator from '../components/material-calculator';
import ProductionDetailRow from '../components/production-detail-row';
import { toast } from 'sonner';
import { useAuth } from '@/providers';

export default function ProductionPlanPage() {
  const router = useRouter();
  const { id } = useParams();
  const planId = parseInt(id as string, 10);
  const { data: plan, isLoading, error } = useProductionPlan(planId);
  const updateStatus = useUpdateProductionPlanStatus();
  const { hasRole } = useAuth();

  const canChangeStatus = hasRole('admin', 'manager', 'ck_staff');
  
  const [activeTab, setActiveTab] = useState<'details' | 'materials'>('details');

  if (isLoading) return <div className="p-8">Loading details...</div>;
  if (error || !plan) return <div className="p-8 text-red-600">Error loading plan details.</div>;

  const handleStatusChange = async (newStatus: any) => {
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;
    try {
      await updateStatus.mutateAsync({ id: planId, data: { status: newStatus } });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-gray-100"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{plan.plan_code}</h2>
            <p className="text-sm text-gray-500 pt-1">
              Started: {new Date(plan.start_date).toLocaleDateString()}
              {plan.end_date ? ` • Ended: ${new Date(plan.end_date).toLocaleDateString()}` : ''}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

            {/* Action Buttons based on status & role */}
            {canChangeStatus && plan.status === 'planned' && (
              <>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                >
                  <Play className="mr-2 h-4 w-4" /> Start Production
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
                >
                  <Ban className="mr-2 h-4 w-4" /> Cancel Plan
                </button>
              </>
            )}
            
            {canChangeStatus && plan.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Mark All Completed
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 text-sm font-medium text-gray-900 mb-2">
            Created By
          </div>
          <div className="text-2xl font-bold text-gray-900">{plan.users?.full_name || 'System'}</div>
          <p className="text-xs text-gray-500 capitalize">{plan.users?.role}</p>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-6 md:col-span-3">
          <div className="flex flex-row items-center justify-between space-y-0 text-sm font-medium text-gray-900 mb-2">
            Notes
          </div>
          <p className="text-sm text-gray-700">{plan.notes || 'No generic notes for this plan.'}</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-4 w-max">
          <button
            onClick={() => setActiveTab('details')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              activeTab === 'details' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Production Items
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              activeTab === 'materials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Material Requirements
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Items to Produce</h3>
              <p className="text-sm text-gray-500 mt-1">Update actual quantities produced and move items to batches once finished.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3 text-center">Planned Qty</th>
                    <th className="px-6 py-3">Produced Qty</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.production_details?.map((detail: any) => (
                    <ProductionDetailRow key={detail.id} detail={detail} planId={plan.id} planStatus={plan.status} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <MaterialCalculator planId={plan.id} />
        )}
      </div>
    </div>
  );
}
