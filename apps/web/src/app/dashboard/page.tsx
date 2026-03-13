/**
 * Dashboard Home Page
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi, reportsApi, storesApi } from '@/lib/api';

export default function DashboardPage() {
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['dashboard-categories-count'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: stores, isLoading: storesLoading, error: storesError } =
    useQuery({
    queryKey: ['dashboard-stores-count'],
    queryFn: () => storesApi.getAll(),
  });

  const { data: productsResp, isLoading: productsLoading, error: productsError } =
    useQuery({
    queryKey: ['dashboard-products-count'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 1 }),
  });

  const { data: overview, isLoading: overviewLoading, error: overviewError } =
    useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => reportsApi.getOverview(),
  });

  const errorMessage =
    (categoriesError as Error | undefined)?.message ||
    (storesError as Error | undefined)?.message ||
    (productsError as Error | undefined)?.message ||
    (overviewError as Error | undefined)?.message ||
    null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to CKMS - Central Kitchen Management System
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Categories"
          value={
            categoriesLoading
              ? '...'
              : categoriesError
                ? 'N/A'
                : String(categories?.length ?? 0)
          }
        />
        <StatCard
          title="Stores"
          value={
            storesLoading
              ? '...'
              : storesError
                ? 'N/A'
                : String(stores?.length ?? 0)
          }
        />
        <StatCard
          title="Products"
          value={
            productsLoading
              ? '...'
              : productsError
                ? 'N/A'
                : String(productsResp?.meta?.total ?? 0)
          }
        />
        <StatCard
          title="Orders"
          value={
            overviewLoading
              ? '...'
              : overviewError
                ? 'N/A'
                : String(overview?.totalOrders ?? 0)
          }
        />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
