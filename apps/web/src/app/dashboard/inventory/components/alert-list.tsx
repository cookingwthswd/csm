import type { AlertResponse } from "@repo/types";

interface Props {
  alerts: AlertResponse[];
  onResolve: (id: number, note?: string) => void;
}

export function AlertList({ alerts, onResolve }: Props) {
  if (!alerts || alerts.length === 0) {
    return <div className="mt-4 text-gray-500">No alerts at the moment.</div>;
  }

  return (
    <table className="min-w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Type</th>
          <th className="border px-2 py-1 text-left">Store</th>
          <th className="border px-2 py-1 text-left">Item</th>
          <th className="border px-2 py-1 text-left">Message</th>
          <th className="border px-2 py-1 text-left">Created</th>
          <th className="border px-2 py-1 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map((a) => (
          <tr key={a.id} className="bg-white">
            <td className="border px-2 py-1 capitalize">
              {a.type.replace("_", " ")}
            </td>
            <td className="border px-2 py-1">{a.storeName || "-"}</td>
            <td className="border px-2 py-1">{a.itemName}</td>
            <td className="border px-2 py-1">{a.message}</td>
            <td className="border px-2 py-1">
              {new Date(a.createdAt).toLocaleString()}
            </td>
            <td className="border px-2 py-1">
              <button
                onClick={() => onResolve(a.id)}
                className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
              >
                Resolve
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
