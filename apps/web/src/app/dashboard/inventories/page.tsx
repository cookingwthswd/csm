/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import {
  inventoriesApi,
  type InventorySummaryRecord,
} from "@/lib/api/inventories";
import { useRouter } from "next/navigation";

export default function InventoryPage() {

  const [data, setData] = useState<InventorySummaryRecord[]>([]);
  const router = useRouter();

  const load = async () => {
    const res = await inventoriesApi.getInventories();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (

    <div className="p-8 max-w-6xl mx-auto text-black">

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Inventory
      </h1>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

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

            {data.map((i) => (

              <tr
                key={i.store_id}
                className="border-t hover:bg-gray-50 cursor-pointer transition"
                onClick={() => router.push(`/dashboard/inventories/${i.store_id}`)}
              >

                <td className="px-6 py-3 font-medium">
                  {i.store_name}
                </td>

                <td className="px-6 py-3">
                  {i.total_items}
                </td>

                <td className="px-6 py-3 font-semibold">
                  {i.total_quantity}
                </td>

                <td className="px-6 py-3 text-gray-500">
                  {i.last_updated
                    ? new Date(i.last_updated).toLocaleString()
                    : "-"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}
