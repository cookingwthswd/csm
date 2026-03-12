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
    <div className="p-6 text-black">

      <h1 className="text-2xl font-bold mb-4">
        Inventory
      </h1>

      <table className="w-full border">

        <thead>
          <tr>
            <th>Store</th>
            <th>Total Items</th>
            <th>Total Quantity</th>
            <th>Last Updated</th>
          </tr>
        </thead>

        <tbody>

          {data.map((i) => (

            <tr
              key={i.store_id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/dashboard/inventories/${i.store_id}`)}
            >
              <td>{i.store_name}</td>
              <td>{i.total_items}</td>
              <td>{i.total_quantity}</td>
              <td>{i.last_updated ? new Date(i.last_updated).toLocaleString() : "-"}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
