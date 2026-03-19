import { useState } from 'react';
import { useUpdateProductionDetail, useCompleteProductionDetail } from '@/hooks/use-production';
import { CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function ProductionDetailRow({ detail, planId, planStatus }: { detail: any; planId: number; planStatus: string }) {
  const [produced, setProduced] = useState(detail.quantity_produced || 0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const updateDetail = useUpdateProductionDetail();
  const completeDetail = useCompleteProductionDetail();
  const { hasRole } = useAuth();

  // Backend: update quantity & complete detail allowed for ck_staff, admin
  const canEditDetail = hasRole('ck_staff', 'admin');

  const handleSaveQuantity = async () => {
    try {
      await updateDetail.mutateAsync({
        planId,
        detailId: detail.id,
        data: { quantityProduced: Number(produced) },
      });
      toast.success('Quantity saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleCompleteClick = () => {
    if (detail.quantity_produced === null) {
      toast.warning('Please save a produced quantity before completing.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const executeComplete = async () => {
    try {
      await completeDetail.mutateAsync({ planId, detailId: detail.id });
      toast.success('Production item completed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete production item');
    }
  };

  const isActive = planStatus === 'in_progress' && canEditDetail;
  const isCompleted = detail.status === 'completed';

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeComplete}
        title="Complete Production Batch"
        message="Completing this will instantly generate a batch code and update the central kitchen inventory (adding products and deducting materials). Do you want to proceed?"
      />
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
        {detail.items?.name || `Product #${detail.item_id}`}
      </td>
      <td className="px-6 py-4 text-center">{detail.quantity_planned}</td>
      <td className="px-6 py-4">
        {isCompleted ? (
          <span className="font-bold text-green-600">{detail.quantity_produced}</span>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="flex h-8 w-24 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={produced}
              onChange={(e) => setProduced(e.target.value)}
              disabled={!isActive}
            />
            <button
              title="Save Quantity"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              onClick={handleSaveQuantity}
              disabled={!isActive || updateDetail.isPending}
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isCompleted
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {detail.status.toUpperCase()}
        </span>
        {isCompleted && detail.batch_id && (
          <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
            Batch #{detail.batch_id} created
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border shadow-sm border-green-200 bg-green-50 text-green-700 hover:bg-green-100 h-8 px-3 disabled:opacity-50 disabled:pointer-events-none"
          onClick={handleCompleteClick}
          disabled={!isActive || isCompleted || completeDetail.isPending}
        >
          <CheckCircle className="mr-2 h-4 w-4" /> Complete
        </button>
      </td>
    </tr>
    </>
  );
}
