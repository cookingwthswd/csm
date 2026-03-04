'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/use-products';
import { useProductsWithRecipes } from '@/hooks/use-recipes';
import { ArrowLeft, Plus } from 'lucide-react';

export default function NewRecipePage() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState('');

  const { data: allProductsData, isLoading: isLoadingProducts } = useProducts({ limit: 200 });
  const { data: productsWithRecipes, isLoading: isLoadingRecipes } = useProductsWithRecipes();

  const configuredIds = new Set((productsWithRecipes || []).map((p: any) => p.id));
  const unconfiguredProducts = (allProductsData?.data || []).filter(
    (p: any) =>
      (p.type === 'finished_product' || p.type === 'semi_finished') &&
      !configuredIds.has(p.id),
  );

  const isLoading = isLoadingProducts || isLoadingRecipes;

  const handleContinue = () => {
    if (!selectedProductId) return;
    router.push(`/dashboard/recipes/${selectedProductId}`);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create Recipe</h2>
      </div>

      <div className="bg-white rounded-lg border shadow-sm max-w-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Select Product</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose a product to define its bill of materials (BOM).
          </p>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading products...</div>
          ) : unconfiguredProducts.length === 0 ? (
            <div className="text-sm text-gray-500">
              All eligible products already have recipes configured.
            </div>
          ) : (
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="" disabled>Select a product...</option>
              {unconfiguredProducts.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.type === 'finished_product' ? 'Finished Product' : 'Semi-finished'}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 h-10 px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedProductId}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-4 w-4" /> Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
