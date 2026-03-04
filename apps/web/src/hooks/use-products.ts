import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import type { ProductQueryDto } from '@repo/types';

export function useProducts(query?: ProductQueryDto) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => productsApi.getAll(query),
  });
}
