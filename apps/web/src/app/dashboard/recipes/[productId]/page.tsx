'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipeByProductId, useSaveRecipe } from '@/hooks/use-recipes';
import { useProducts } from '@/hooks/use-products';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers';

type DetailRow = { materialId: string; quantity: number; id?: number };

export default function RecipeEditorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { productId: productIdParam } = useParams();
  const productId = parseInt(productIdParam as string, 10);

  const { data: recipeData, isLoading: isRecipeLoading } = useRecipeByProductId(productId);
  const { data: materialsData, isLoading: isMaterialsLoading } = useProducts({ type: 'material', limit: 100 });
  const saveRecipe = useSaveRecipe();
  const { hasRole } = useAuth();

  const canEditRecipe = hasRole('admin', 'manager', 'ck_staff');

  // null = chưa user edit gì → dùng data từ DB
  // array = user đã bắt đầu edit → dùng local state
  const [localDetails, setLocalDetails] = useState<DetailRow[] | null>(null);

  if (isRecipeLoading || isMaterialsLoading) return <div className="p-8 text-gray-500">Loading recipe...</div>;

  const materials = materialsData?.data || [];

  // Source of truth: local edits nếu có, còn không lấy từ DB
  const details: DetailRow[] =
    localDetails ??
    ((recipeData as any)?.recipe_details ?? []).map((d: any) => ({
      materialId: String(d.material_id),
      quantity: d.quantity,
      id: d.id,
    }));

  const setDetails = (next: DetailRow[]) => setLocalDetails(next);

  const handleAddMaterial = () => {
    setDetails([...details, { materialId: '', quantity: 1 }]);
  };

  const handleRemoveMaterial = (index: number) => {
    const item = details[index];
    if (item.id && !confirm('Remove this material? Save afterwards to apply changes.')) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof DetailRow, value: string | number) => {
    const next = [...details];
    next[index] = { ...next[index], [field]: value };
    setDetails(next);
  };

  const handleSave = async () => {
    const validDetails = details
      .filter((d) => d.materialId !== '')
      .map((d) => ({
        materialId: parseInt(d.materialId, 10),
        quantity: Number(d.quantity),
      }));

    if (validDetails.length === 0) {
      toast.warning('Please add at least one material before saving.');
      return;
    }

    try {
      await saveRecipe.mutateAsync({ productId, materials: validDetails });
      queryClient.removeQueries({ queryKey: ['recipes', 'products'] });
      queryClient.removeQueries({ queryKey: ['recipes', 'product', productId] });
      toast.success('Recipe saved successfully!');
      router.push('/dashboard/recipes');
    } catch {
      toast.error('Failed to save recipe.');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-gray-100"
          onClick={() => router.push('/dashboard/recipes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Recipe for {(recipeData as any)?.name ?? `Product #${productId}`}
            </h2>
            <p className="text-sm text-gray-500 pt-1">Define the bill of materials needed to produce 1 unit of this product.</p>
          </div>
          {canEditRecipe && (
            <button
              onClick={handleSave}
              disabled={saveRecipe.isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveRecipe.isPending ? 'Saving...' : 'Save Recipe'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex flex-row items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
            <p className="text-sm text-gray-500 mt-1">Select materials and required quantities per 1 unit produced.</p>
          </div>
          {canEditRecipe && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 h-9 px-3"
              onClick={handleAddMaterial}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Material
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Material</th>
                <th className="px-6 py-3">Quantity per Unit</th>
                <th className="px-6 py-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No materials added. Click &quot;Add Material&quot; to start.
                  </td>
                </tr>
              ) : (
                details.map((detail, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        value={detail.materialId}
                        onChange={(e) => handleChange(index, 'materialId', e.target.value)}
                        disabled={!canEditRecipe}
                      >
                        <option value="" disabled>Select a material...</option>
                        {materials.map((m: any) => (
                          <option key={m.id} value={String(m.id)}>
                            {m.name} ({m.unit || 'unit'})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={detail.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="flex h-10 w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={!canEditRecipe}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {canEditRecipe && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md h-10 w-10 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
