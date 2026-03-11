/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { inventoriesApi } from "@/lib/api/inventories";
import { useRouter } from "next/navigation";

export default function InventoryPage() {

  const [data, setData] = useState<any[]>([]);
  const router = useRouter();

  const load = async () => {
    const res = await inventoriesApi.getInventories();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Inventory
      </h1>

      <table className="w-full border">

        <thead>
          <tr>
            <th>Store</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>

        <tbody>

          {data.map((i) => (

            <tr
              key={i.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/dashboard/inventories/${i.store_id}`)}
            >
              <td>{i.stores?.name}</td>
              <td>{i.items?.name}</td>
              <td>{i.quantity}</td>
              <td>{i.min_stock_level}</td>
              <td>{i.max_stock_level}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
