"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import Link from "next/link";

export function LowStockWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["lowStockCount"],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const count = data?.length ?? 0;

  return (
    <div>
      {isLoading ? (
        <span className="text-gray-500">Loading...</span>
      ) : (
        <Link
          href="/dashboard/inventory/alerts"
          className="inline-flex items-center gap-1"
        >
          <span className="rounded-full bg-yellow-300 px-2 py-1 text-xs font-semibold">
            Low stock: {count}
          </span>
        </Link>
      )}
    </div>
  );
}
