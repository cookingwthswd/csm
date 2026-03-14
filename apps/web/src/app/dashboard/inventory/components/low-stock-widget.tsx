"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import Link from "next/link";

export function LowStockWidget() {
  const [count, setCount] = useState(0);

  const { data, isLoading } = useQuery(["lowStockCount"], () =>
    inventoryApi.getLowStock(),
  );

  useEffect(() => {
    if (data) {
      setCount(data.length);
    }
  }, [data]);

  return (
    <div>
      {isLoading ? (
        <span className="text-gray-500">Loading...</span>
      ) : (
        <Link
          href="/dashboard/inventory"
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
