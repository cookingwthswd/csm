'use client';

import { Suspense } from 'react';
import { useProductsWithRecipes } from '@/hooks/use-recipes';
import Link from 'next/link';

function RecipesTable() {
  const { data: products, isLoading, error } = useProductsWithRecipes();

  if (isLoading) return <div className="p-6 text-gray-500">Loading configured recipes...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading recipes.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Product ID</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Recipe Configured</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(!products || products.length === 0) ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                No product recipes configured. Select any product to define its recipe.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  #{product.id}
                </td>
                <td className="px-6 py-4">{product.name}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/recipes/${product.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border shadow-sm border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 h-8 px-3"
                  >
                    Edit Recipe
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

export default function RecipesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Product Recipes (BOM)</h2>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Configured Products</h3>
          <p className="text-sm text-gray-500 mt-1">Products that have bill of materials defined for Central Kitchen production.</p>
        </div>
        <div className="p-0">
          <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
            <RecipesTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
