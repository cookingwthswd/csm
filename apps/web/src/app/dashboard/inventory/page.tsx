"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import { StockTable } from "./components/stock-table";
import { LowStockWidget } from "./components/low-stock-widget";
import type { InventoryResponse } from "@repo/types";

export default function InventoryDashboardPage() {
  const [items, setItems] = useState<InventoryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.getAll(),
  });

  useEffect(() => {
    if (data && !isLoading) {
      setItems(data);
    }
    if (isError && queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [data, isLoading, isError, queryError]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <LowStockWidget />
      </div>
      <nav className="mt-4 flex gap-4">
        <a href="/dashboard/inventory" className="text-blue-600 underline">
          Overview
        </a>
        <a
          href="/dashboard/inventory/transactions"
          className="text-blue-600 underline"
        >
          Transactions
        </a>
        <a
          href="/dashboard/inventory/alerts"
          className="text-blue-600 underline"
        >
          Alerts
        </a>
      </nav>

      {isLoading && <div className="text-gray-500">Loading stock...</div>}
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {!isLoading && items && <StockTable data={items} />}
    </div>
  );
}
