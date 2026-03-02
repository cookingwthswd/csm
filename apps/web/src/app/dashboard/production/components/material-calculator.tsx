import { useProductionMaterials } from '@/hooks/use-production';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MaterialCalculator({ planId }: { planId: number }) {
  const { data: materials, isLoading, error } = useProductionMaterials(planId);

  if (isLoading) return <div className="p-4">Calculating materials...</div>;
  if (error) return <div className="p-4 text-red-600">Error calculating materials.</div>;
  if (!materials || materials.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-8 text-center text-gray-500">
          No materials assigned via recipes for the items in this plan.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Material</th>
              <th className="px-6 py-3">Calculated Requirement</th>
              <th className="px-6 py-3">Current CK Stock</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((mat: any) => {
              const hasShortage = mat.shortage > 0;

              return (
                <tr key={mat.materialId} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {mat.materialName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{mat.requiredQuantity}</span> {mat.unit}
                  </td>
                  <td className="px-6 py-4">
                    {mat.currentStock !== undefined ? (
                      <span className={hasShortage ? 'text-red-600 font-bold' : 'text-green-600 font-medium'}>
                        {mat.currentStock} {mat.unit}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {hasShortage ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3" /> Shortage: {mat.shortage} {mat.unit}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" /> In Stock
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
