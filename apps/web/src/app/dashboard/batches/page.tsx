/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { batchesApi } from "@/lib/api/batches";
import { useRouter } from "next/navigation";

export default function BatchesPage() {

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    const res = await batchesApi.getBatches();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (

    <div className="p-8 max-w-6xl mx-auto text-black">

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Batches
      </h1>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">Batch Code</th>
              <th className="text-left px-6 py-3">Item</th>
              <th className="text-left px-6 py-3">Expiry</th>
              <th className="text-left px-6 py-3">Current Qty</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  Loading batches...
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No batches found
                </td>
              </tr>
            )}

            {data.map((b) => (

              <tr
                key={b.id}
                className="border-t hover:bg-gray-50 cursor-pointer transition"
                onClick={() => router.push(`/dashboard/batches/${b.id}`)}
              >
                <td className="px-6 py-3 font-medium">{b.batch_code}</td>
                <td className="px-6 py-3">{b.items?.name}</td>
                <td className="px-6 py-3">
                  {new Date(b.expiry_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 font-semibold">
                  {b.current_quantity}
                </td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
