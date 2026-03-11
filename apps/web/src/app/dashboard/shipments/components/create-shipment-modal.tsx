/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { orderApi } from "@/lib/api/orders";
import { AlertCircle } from "lucide-react";

export default function CreateShipmentModal({ isOpen, onClose, onSuccess }: any) {

  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<Record<number, any[]>>({});

  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBatches = async (itemId: number) => {
    if (batches[itemId]) return;

    try {
      const res = await shipmentsApi.getBatchesByItem(itemId);

        setBatches(prev => ({ ...prev, [itemId]: res as any[] })); } catch { console.error("Failed to load batches"); }
  };

  useEffect(() => {
    if (!orderId) return;

    const loadItems = async () => {
      const res = await orderApi.getOrderItemsWithRemaining(orderId);
      setOrderItems(res);
    };

    loadItems();
  }, [orderId]);

  useEffect(() => {
    orderItems.forEach((item) => {
      if (item.item?.id) {
        loadBatches(item.item.id);
      }
    });
  }, [orderItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId || selectedItems.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    for (const selected of selectedItems) {
      const orderItem = orderItems.find(
        (o) => o.id === selected.order_item_id
      );

      if (!orderItem) continue;

      if (selected.quantity_shipped > orderItem.remaining_quantity) {
        setError(
          `Sản phẩm ${orderItem.item?.name} chỉ còn ${orderItem.remaining_quantity}`
        );
        return;
      }

      if (!selected.batch_id) {
        setError(`Vui lòng chọn batch cho ${orderItem.item?.name}`);
        return;
      }

      if (!orderItem.batch_id) {
        setError("Please select batch");
        return;
      }

    }

    try {
      setIsLoading(true);

      const shipment = await shipmentsApi.create({
        order_id: orderId,
        driver_name: driverName,
        driver_phone: driverPhone,
        notes,
      });

      for (const item of selectedItems) {
        await shipmentsApi.addItem(shipment.id, item);
      }

      alert("Tạo vận đơn thành công!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Tạo vận đơn thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Shipment">
      <form onSubmit={handleSubmit} className="space-y-4 p-4 text-black">

        {error && (
          <div className="flex gap-2 p-3 text-red-700 bg-red-50 border rounded">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label className="font-bold">Order ID</label>
          <input
            type="number"
            placeholder="Order ID"
            value={orderId ?? ""}
            onChange={(e) => setOrderId(Number(e.target.value))}
            className="w-full border rounded px-3 h-10"
          />
        </div>

        <div className="border rounded p-3 space-y-3">
          <p className="font-semibold text-sm">Chọn sản phẩm</p>

          {orderItems.map((item) => (
            <div key={item.id} className="flex gap-2 items-center">

              <div className="flex-1">
                <p className="text-sm font-medium">{item.item?.name}</p>
                <p className="text-xs text-gray-500">
                  Remaining: {item.remaining_quantity}
                </p>
              </div>

              <input
                type="number"
                min={0}
                max={item.remaining_quantity}
                className="w-20 border rounded px-2 h-9"
                onChange={(e) => {
                  const qty = Number(e.target.value);

                  setSelectedItems((prev) => {
                    const filtered = prev.filter(
                      (i) => i.order_item_id !== item.id
                    );

                    if (qty > 0) {
                      return [
                        ...filtered,
                        {
                          order_item_id: item.id,
                          quantity_shipped: qty,
                          batch_id: null,
                        },
                      ];
                    }

                    return filtered;
                  });
                }}
              />

              <select
                className="w-40 border rounded px-2 h-9"
                onChange={(e) => {
                  const batchId = Number(e.target.value);

                  setSelectedItems((prev) =>
                    prev.map((i) =>
                      i.order_item_id === item.id
                        ? { ...i, batch_id: batchId }
                        : i
                    )
                  );
                }}
              >
                <option value="">Select batch</option>

                {(batches[item.item?.id] || []).map((batch) => (
                  <option
                    key={batch.id}
                    value={batch.id}
                    disabled={batch.current_quantity <= 0}
                  >
                    {batch.batch_code} (Remaining: {batch.current_quantity})
                  </option>
                ))}
              </select>

            </div>
          ))}
        </div>

        <div>
          <label className="font-bold">Driver Name</label>
          <input
            placeholder="Enter driver name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full border rounded px-3 h-10"
          />
        </div>

        <div>
          <label className="font-bold">Driver Phone</label>
          <input
            placeholder="Enter driver phone"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            className="w-full border rounded px-3 h-10"
          />
        </div>

        <div>
          <label className="font-bold">Notes</label>
          <textarea
            placeholder="Enter notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" loading={isLoading}>
            Create Shipment
          </Button>
        </div>

      </form>
    </Modal>
  );
}
