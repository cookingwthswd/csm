"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { inventoriesApi } from "@/lib/api/inventories";
import { LowStockWidget } from "./components/low-stock-widget";

export default function InventoryDashboardPage() {

  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoriesApi.getInventories(),
  });

  const inventories = data ?? [];

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

      {isLoading && (
        <div className="mt-6 text-gray-500">
          Loading inventory...
        </div>
      )}

      {error instanceof Error && (
        <div className="mt-6 rounded bg-red-50 p-3 text-red-600">
          {error.message}
        </div>
      )}

      {!isLoading && (

        <div className="mt-6 bg-white border rounded-lg overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-3">Store</th>
                <th className="text-left px-6 py-3">Total Items</th>
                <th className="text-left px-6 py-3">Total Quantity</th>
                <th className="text-left px-6 py-3">Last Updated</th>
              </tr>
            </thead>

            <tbody>

              {inventories.map((inv) => (

                <tr
                  key={inv.store_id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/inventory/${inv.store_id}`)
                  }
                >

                  <td className="px-6 py-3 font-medium">
                    {inv.store_name}
                  </td>

                  <td className="px-6 py-3">
                    {inv.total_items}
                  </td>

                  <td className="px-6 py-3 font-semibold">
                    {inv.total_quantity}
                  </td>

                  <td className="px-6 py-3 text-gray-500">
                    {inv.last_updated
                      ? new Date(inv.last_updated).toLocaleString()
                      : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}
