/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { batchesApi } from "@/lib/api/batches";
import { useRouter } from "next/navigation";

export default function BatchesPage() {

  const [data, setData] = useState<any[]>([]);
  const router = useRouter();

  const load = async () => {
    const res = await batchesApi.getBatches();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Batches
      </h1>

      <table className="w-full border">

        <thead>
          <tr>
            <th>Batch Code</th>
            <th>Item</th>
            <th>Expiry</th>
            <th>Current Qty</th>
          </tr>
        </thead>

        <tbody>

          {data.map((b) => (

            <tr
              key={b.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/dashboard/batches/${b.id}`)}
            >

              <td>{b.batch_code}</td>
              <td>{b.items?.name}</td>
              <td>{b.expiry_date}</td>
              <td>{b.current_quantity}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
