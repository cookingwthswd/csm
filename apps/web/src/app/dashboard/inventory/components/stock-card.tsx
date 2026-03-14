import type { InventoryResponse } from "@repo/types";

export function StockCard({ item }: { item: InventoryResponse }) {
  return (
    <div
      className={`rounded border p-4 shadow-sm ${
        item.isLowStock
          ? "bg-yellow-50 border-yellow-300"
          : "bg-white border-gray-200"
      }`}
    >
      <h3 className="text-lg font-semibold">
        {item.itemName} ({item.itemSku})
      </h3>
      <p className="text-sm text-gray-600">Store: {item.storeName}</p>
      <p className="mt-2">
        Qty: <strong>{item.quantity}</strong>
      </p>
      <p className="text-xs text-gray-500">
        Min {item.minStockLevel} / Max {item.maxStockLevel}
      </p>
      {item.isLowStock && <p className="mt-1 text-red-600">Low stock</p>}
    </div>
  );
}
