import type { TransactionResponse } from "@repo/types";

export function TransactionTable({ data }: { data: TransactionResponse[] }) {
  if (!data || data.length === 0) {
    return <div className="mt-4 text-gray-500">No transactions found.</div>;
  }

  return (
    <table className="min-w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Date</th>
          <th className="border px-2 py-1 text-left">Store</th>
          <th className="border px-2 py-1 text-left">Item</th>
          <th className="border px-2 py-1 text-right">Change</th>
          <th className="border px-2 py-1 text-left">Type</th>
          <th className="border px-2 py-1 text-left">Reference</th>
          <th className="border px-2 py-1 text-left">Note</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tx) => (
          <tr key={tx.id} className="bg-white">
            <td className="border px-2 py-1">
              {new Date(tx.createdAt).toLocaleString()}
            </td>
            <td className="border px-2 py-1">{tx.storeName}</td>
            <td className="border px-2 py-1">{tx.itemName}</td>
            <td
              className={`border px-2 py-1 text-right ${
                tx.quantityChange < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {tx.quantityChange}
            </td>
            <td className="border px-2 py-1 capitalize">{tx.type}</td>
            <td className="border px-2 py-1">
              {tx.referenceType} {tx.referenceId || ''}
            </td>
            <td className="border px-2 py-1">{tx.note || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
