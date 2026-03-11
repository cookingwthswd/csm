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
    <div className="p-6 space-y-6">

      <div>

        <h1 className="text-xl font-bold">
          Batch {batch.batch_code}
        </h1>

        <p>Item: {batch.items?.name}</p>
        <p>Expiry: {batch.expiry_date}</p>
        <p>Quantity: {batch.current_quantity}</p>

      </div>

      <div>

        <h2 className="font-bold mb-2">
          Transaction History
        </h2>

        <table className="w-full border">

          <thead>
            <tr>
              <th>Store</th>
              <th>Change</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {transactions.map((t) => (

              <tr key={t.id}>

                <td>{t.stores?.name}</td>
                <td>{t.quantity_change}</td>
                <td>{t.transaction_type}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
