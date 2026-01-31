'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, type DashboardOverview } from '@/lib/api/reports';

export function useDashboard() {
  const query = useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: () => reportsApi.getOverview(),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
