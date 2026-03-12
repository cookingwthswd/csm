/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState } from "react";
import { batchesApi } from "@/lib/api/batches";
import { useParams } from "next/navigation";

export default function BatchDetailPage() {

  const { batchId } = useParams();

  const [batch, setBatch] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const load = async () => {

    const batchRes = await batchesApi.getBatchDetail(Number(batchId));
    const transRes = await batchesApi.getBatchTransactions(Number(batchId));

    setBatch(batchRes);
    setTransactions(transRes);

  };

  useEffect(() => {
    load();
  }, []);

  if (!batch) return null;

  return (

    <div className="p-8 max-w-6xl mx-auto space-y-6 text-black">

      {/* Batch Info */}

      <div className="bg-white rounded-xl shadow border p-6">

        <h1 className="text-2xl font-bold mb-4">
          Batch {batch.batch_code}
        </h1>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>
            <span className="text-gray-500">Item</span>
            <p className="font-medium">{batch.items?.name}</p>
          </div>

          <div>
            <span className="text-gray-500">Expiry Date</span>
            <p className="font-medium">
              {new Date(batch.expiry_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <span className="text-gray-500">Current Quantity</span>
            <p className="font-semibold text-lg">
              {batch.current_quantity}
            </p>
          </div>

        </div>

      </div>

      {/* Transactions */}

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <div className="px-6 py-4 border-b font-semibold">
          Transaction History
        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">Store</th>
              <th className="text-left px-6 py-3">Change</th>
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-left px-6 py-3">Date</th>
            </tr>
          </thead>

          <tbody>

            {transactions.map((t) => (

              <tr key={t.id} className="border-t">

                <td className="px-6 py-3">{t.stores?.name}</td>

                <td className="px-6 py-3 font-semibold">
                  {t.quantity_change}
                </td>

                <td className="px-6 py-3 capitalize">
                  {t.transaction_type}
                </td>

                <td className="px-6 py-3">
                  {new Date(t.created_at).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}
