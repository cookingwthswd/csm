"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import { AlertList } from "../components/alert-list";
import type { AlertResponse, ResolveAlertDto } from "@repo/types";

export default function InventoryAlertsPage() {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<AlertResponse[]>({
    queryKey: ["inventoryAlerts"],
    queryFn: () => inventoryApi.getAlerts(),
  });

  useEffect(() => {
    if (data && !isLoading) {
      setAlerts(data || []);
    }
    if (isError && queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [data, isLoading, isError, queryError]);

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
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {!isLoading && alerts && (
        <AlertList alerts={alerts} onResolve={handleResolve} />
      )}
    </div>
  );
}
