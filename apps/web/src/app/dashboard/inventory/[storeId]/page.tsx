"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";

export default function InventoryStorePage() {

  const { storeId } = useParams();
  const [searchName, setSearchName] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory-store", storeId],
    queryFn: () => inventoryApi.getAll(Number(storeId)),
    enabled: !!storeId,
  });

  const items = useMemo(() => data ?? [], [data]);

  const filteredItems = useMemo(() => {
    const search = searchName.trim().toLowerCase();
    if (!search) return items;

    return items.filter((item) =>
      item.itemName.toLowerCase().includes(search)
    );
  }, [items, searchName]);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Store Inventory
      </h1>

      <div className="mb-4">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search by item name..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {isLoading && <div>Loading...</div>}

      {error instanceof Error && (
        <div className="text-red-600">{error.message}</div>
      )}

      {!isLoading && (

        <table className="w-full text-sm bg-white border rounded-lg">

          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Item</th>
              <th className="px-6 py-3 text-left">SKU</th>
              <th className="px-6 py-3 text-left">Unit</th>
              <th className="px-6 py-3 text-left">Quantity</th>
              <th className="px-6 py-3 text-left">Min</th>
              <th className="px-6 py-3 text-left">Max</th>
              <th className="px-6 py-3 text-left">Low Stock</th>
            </tr>
          </thead>

          <tbody>

            {filteredItems.map((item) => (

              <tr key={item.id} className="border-t">

                <td className="px-6 py-3">
                  {item.itemName}
                </td>

                <td className="px-6 py-3">
                  {item.itemSku}
                </td>

                <td className="px-6 py-3">
                  {item.unit}
                </td>

                <td className="px-6 py-3 font-semibold">
                  {item.quantity}
                </td>

                <td className="px-6 py-3">
                  {item.minStockLevel}
                </td>

                <td className="px-6 py-3">
                  {item.maxStockLevel}
                </td>

                <td className="px-6 py-3">
                  {item.isLowStock ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      No
                    </span>
                  )}
                </td>

              </tr>

            ))}

            {!filteredItems.length && (
              <tr className="border-t">
                <td className="px-6 py-6 text-gray-500" colSpan={7}>
                  No items match your search.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      )}

    </div>
  );
}
