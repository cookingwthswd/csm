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
    <div className="p-6 text-black">

      <h1 className="text-xl font-bold mb-4">
        Inventory Detail
      </h1>

      <table className="w-full border">

        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>

        <tbody>

          {data.map((i) => (

            <tr key={i.id}>

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
