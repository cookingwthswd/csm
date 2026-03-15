"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import { AlertList } from "../components/alert-list";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { AlertResponse } from "@repo/types";

export default function InventoryAlertsPage() {
  const queryClient = useQueryClient();
  const authLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<AlertResponse[]>({
    queryKey: ["inventoryAlerts"],
    queryFn: () => inventoryApi.getAlerts(),
    enabled: !authLoading && !!session,
    retry: false,
  });

  const alerts = data ?? [];
  const error = isError && queryError instanceof Error ? queryError.message : null;

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      inventoryApi.resolveAlert(id, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryAlerts"] });
    },
  });

  const handleResolve = (id: number, note?: string) => {
    resolveMutation.mutate({ id, note });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Inventory Alerts</h1>

      {isLoading && <div className="text-gray-500">Loading alerts...</div>}
      {!authLoading && !session && (
        <div className="mt-4 rounded bg-yellow-50 p-3 text-yellow-700">
          Please sign in to view inventory alerts.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {!isLoading && !!session && (
        <AlertList alerts={alerts} onResolve={handleResolve} />
      )}
    </div>
  );
}
