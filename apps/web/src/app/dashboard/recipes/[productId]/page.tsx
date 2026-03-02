'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipeByProductId, useSaveRecipe, useDeleteRecipeDetail } from '@/hooks/use-recipes';
import { useProducts } from '@/hooks/use-products';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RecipeEditorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { productId: productIdParam } = useParams();
  const productId = parseInt(productIdParam as string, 10);
  
  const { data: recipeData, isLoading: isRecipeLoading } = useRecipeByProductId(productId);
  const { data: materialsData, isLoading: isMaterialsLoading } = useProducts({ type: 'material', limit: 100 });
  const saveRecipe = useSaveRecipe();
  const deleteDetail = useDeleteRecipeDetail();

  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    if (recipeData?.recipe_details) {
      setDetails(
        recipeData.recipe_details.map((d: any) => ({
          materialId: d.material_id.toString(),
          quantity: d.quantity,
          id: d.id, // Keep track of original ID to attempt single delete (if supported without saving array)
        }))
      );
    }
  }, [recipeData]);

  if (isRecipeLoading || isMaterialsLoading) return <div className="p-8">Loading recipe...</div>;
  if (!recipeData) return <div className="p-8 text-red-600">Recipe or product not found.</div>;

  const materials = materialsData?.data || [];

  const handleAddMaterial = () => {
    setDetails([...details, { materialId: '', quantity: 1 }]);
  };

  const handleRemoveMaterial = async (index: number) => {
    const item = details[index];
    if (item.id) {
       // Optional: delete immediately or wait for whole save. We will wait for save in this design, deleting whole list and reinserting.
       // However, to be explicit per requirement:
       if (!confirm("Remove this material? Make sure to save changes afterwards.")) return;
       // We can just remove from local state. The saveRecipe overwrites all.
    }
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string | number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSave = async () => {
    const validDetails = details
      .filter((d) => d.materialId !== '')
      .map((d) => ({
        materialId: parseInt(d.materialId as string, 10),
        quantity: Number(d.quantity),
      }));

    try {
      await saveRecipe.mutateAsync({
        productId,
        materials: validDetails,
      });
      // Clear recipes list cache so it refreshes when navigating back
      queryClient.removeQueries({ queryKey: ['recipes', 'products'] });
      toast.success('Recipe saved successfully!');
    } catch (error) {
      toast.error('Failed to save recipe.');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-gray-100" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Recipe for {recipeData.name}</h2>
            <p className="text-sm text-gray-500 pt-1">Define the bill of materials needed to produce 1 unit of this product.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveRecipe.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 py-2 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" /> {saveRecipe.isPending ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex flex-row items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
            <p className="text-sm text-gray-500 mt-1">Select materials and required quantities from CK inventory.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border shadow-sm border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 h-9 px-3"
            onClick={handleAddMaterial}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Material</th>
                <th className="px-6 py-3">Quantity per Unit</th>
                <th className="px-6 py-3 w-[100px]"></th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No materials added to this recipe.
                  </td>
                </tr>
              ) : (
                details.map((detail, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={detail.materialId}
                        onChange={(e) => handleChange(index, 'materialId', e.target.value)}
                      >
                        <option value="" disabled>Select a material...</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.unit || 'unit'})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detail.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="flex h-10 w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
