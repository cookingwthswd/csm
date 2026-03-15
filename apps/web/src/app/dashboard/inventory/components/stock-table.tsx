import type { InventoryResponse } from "@repo/types";

interface StockTableProps {
  data: InventoryResponse[];
  onRowClick?: (inv: InventoryResponse) => void;
  selectedId?: number;
}

export function StockTable({ data, onRowClick, selectedId }: StockTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-4 text-gray-500">No inventory records found.</div>
    );
  }

  return (
    <table className="min-w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Store</th>
          <th className="border px-2 py-1 text-left">Item</th>
          <th className="border px-2 py-1 text-right">Qty</th>
          <th className="border px-2 py-1 text-right">Min</th>
          <th className="border px-2 py-1 text-right">Max</th>
          <th className="border px-2 py-1 text-left">Status</th>
          <th className="border px-2 py-1 text-left">Updated</th>
        </tr>
      </thead>
      <tbody>
        {data.map((inv) => (
          <tr
            key={inv.id}
            className={`${
              inv.id === selectedId
                ? "bg-blue-50"
                : inv.isLowStock
                ? "bg-yellow-50"
                : "bg-white"
            } ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
            onClick={() => onRowClick?.(inv)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && onRowClick) {
                e.preventDefault();
                onRowClick(inv);
              }
            }}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            <td className="border px-2 py-1">{inv.storeName}</td>
            <td className="border px-2 py-1">
              {inv.itemName} ({inv.itemSku})
            </td>
            <td className="border px-2 py-1 text-right">{inv.quantity}</td>
            <td className="border px-2 py-1 text-right">{inv.minStockLevel}</td>
            <td className="border px-2 py-1 text-right">{inv.maxStockLevel}</td>
            <td className="border px-2 py-1">
              {inv.isLowStock ? (
                <span className="text-yellow-800">Low</span>
              ) : (
                <span className="text-green-800">OK</span>
              )}
            </td>
            <td className="border px-2 py-1">
              {new Date(inv.lastUpdated).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
