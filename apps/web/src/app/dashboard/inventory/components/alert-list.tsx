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
    <div className="overflow-x-auto">
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
          {alerts.map((a) => {
            const isResolvable = a.status === "unresolved";

            return (
              <tr key={a.id} className="bg-white">
                <td className="border px-2 py-1 capitalize">
                  {a.type.replaceAll("_", " ")}
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
                    disabled={!isResolvable}
                    className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isResolvable ? "Resolve" : "Resolved"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
