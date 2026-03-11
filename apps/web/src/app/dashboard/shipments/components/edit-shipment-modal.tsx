/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { orderApi } from "@/lib/api/orders";
import { AlertCircle } from "lucide-react";

export function EditShipmentModal({ shipment, isOpen, onClose, onSuccess }: any) {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<Record<number, any[]>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async (itemId: number) => {
    if (batches[itemId]) return;

    try {
      const res = await shipmentsApi.getBatchesByItem(itemId);

      setBatches(prev => ({ ...prev, [itemId]: res as any[] }));
    } catch {
      console.error("Failed to load batches");
    }
  };

  useEffect(() => {
    if (!isOpen || !shipment) return;

    const init = async () => {
      setDriverName(shipment.driver_name || "");
      setDriverPhone(shipment.driver_phone || "");
      setNotes(shipment.notes || "");

      const items = await orderApi.getOrderItemsWithRemaining(shipment.order_id);
      const shipmentItems = await shipmentsApi.getItems(shipment.id);

      const merged = items.map((item: any) => {
        const existing = shipmentItems.find(
          (s: any) => s.order_item_id === item.id
        );

        return {
          ...item,
          quantity_shipped: existing?.quantity_shipped || 0,
          batch_id: existing?.batch_id || null,
          shipment_item_id: existing?.id || null,
        };
      });

      setOrderItems(merged);

      setSelectedItems(
        merged
          .filter((i: any) => i.quantity_shipped > 0)
          .map((i: any) => ({
            order_item_id: i.id,
            quantity_shipped: i.quantity_shipped,
            batch_id: i.batch_id,
            shipment_item_id: i.shipment_item_id,
          }))
      );

      // load batches
      merged.forEach((item: any) => {
        if (item.item?.id) loadBatches(item.item.id);
      });
    };

    init();
  }, [isOpen, shipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      await shipmentsApi.update(shipment.id, {
        driver_name: driverName,
        driver_phone: driverPhone,
        notes,
      });

      const currentItems = await shipmentsApi.getItems(shipment.id);

      for (const item of selectedItems) {
        const existing = currentItems.find(
          (i: any) => i.order_item_id === item.order_item_id
        );

        if (existing) {
          await shipmentsApi.updateItem(
            shipment.id,
            existing.id,
            {
              order_item_id: item.order_item_id,
              quantity_shipped: item.quantity_shipped,
              batch_id: item.batch_id,
            }
          );
        } else {
          await shipmentsApi.addItem(
            shipment.id,
            {
              order_item_id: item.order_item_id,
              quantity_shipped: item.quantity_shipped,
              batch_id: item.batch_id,
            }
          );
        }
      }

      alert("Cập nhật vận đơn thành công!");
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${shipment?.shipment_code}`}>
      <div className="text-black">
        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-black">

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ITEMS */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-sm font-semibold">Chọn sản phẩm</p>

            {orderItems.map((item) => {
              const selected = selectedItems.find(
                (i) => i.order_item_id === item.id
              );

              return (
                <div key={item.id} className="flex gap-2 items-center">

                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.item?.name}</p>
                    <p className="text-xs text-gray-500">
                      Remaining: {item.remaining_quantity}
                    </p>
                  </div>

                  {/* Quantity */}
                  <input
                    type="number"
                    min={0}
                    max={item.remaining_quantity}
                    value={selected?.quantity_shipped || 0}
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
                              batch_id: selected?.batch_id ?? null,
                            },
                          ];
                        }

                        return filtered;
                      });
                    }}
                  />

                  {/* Batch Select */}
                  <select
                    className="w-40 border rounded px-2 h-9"
                    value={selected?.batch_id ?? ""}
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
              );
            })}
          </div>

          {/* DRIVER INFO */}
          <div>
            <label className="block text-sm font-bold mb-1">Driver Name</label>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full border rounded px-3 h-10"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Driver Phone</label>
            <input
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="w-full border rounded px-3 h-10"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>

            <Button type="submit" loading={isLoading}>
              Lưu thay đổi
            </Button>
          </div>

        </form>
      </div>
    </Modal>
  );
}
