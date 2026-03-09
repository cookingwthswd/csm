'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProductsWithRecipes } from '@/hooks/use-recipes';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/providers';

export default function RecipesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { hasRole } = useAuth();

  const { data: productsWithRecipes, isLoading } = useProductsWithRecipes();

  const filtered = (productsWithRecipes || []).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Product Recipes (BOM)</h2>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {/* Search + Create button */}
        <div className="p-6 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {hasRole('admin', 'manager', 'ck_staff') && (
            <button
              onClick={() => router.push('/dashboard/recipes/new')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Recipe
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : (
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No recipes match your search.' : 'No recipes configured yet. Click "Create Recipe" to add one.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((product: any) => (
                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        #{product.id}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {hasRole('admin', 'manager', 'ck_staff') && (
                          <Link
                            href={`/dashboard/recipes/${product.id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border shadow-sm border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 h-8 px-3"
                          >
                            Edit Recipe
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
