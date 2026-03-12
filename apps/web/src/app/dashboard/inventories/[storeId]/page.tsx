/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { inventoriesApi } from "@/lib/api/inventories";
import { useParams } from "next/navigation";

export default function InventoryDetailPage() {

  const { storeId } = useParams();
  const [data, setData] = useState<any[]>([]);

  const load = async () => {
    const res = await inventoriesApi.getInventoryDetail(Number(storeId));
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (

    <div className="p-8 max-w-6xl mx-auto text-black">

      <h1 className="text-3xl font-bold mb-6">
        Inventory Detail
      </h1>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">Item</th>
              <th className="text-left px-6 py-3">Quantity</th>
              <th className="text-left px-6 py-3">Min</th>
              <th className="text-left px-6 py-3">Max</th>
            </tr>
          </thead>

          <tbody>

            {data.map((i) => (

              <tr key={i.id} className="border-t">

                <td className="px-6 py-3 font-medium">
                  {i.items?.name}
                </td>

                <td className="px-6 py-3 font-semibold">
                  {i.quantity}
                </td>

                <td className="px-6 py-3 text-gray-600">
                  {i.min_stock_level}
                </td>

                <td className="px-6 py-3 text-gray-600">
                  {i.max_stock_level}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}
