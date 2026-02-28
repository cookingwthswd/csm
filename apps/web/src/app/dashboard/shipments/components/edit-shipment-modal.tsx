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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load dữ liệu khi mở modal
  useEffect(() => {
    if (!isOpen || !shipment) return;

    const init = async () => {
      setDriverName(shipment.driver_name || "");
      setDriverPhone(shipment.driver_phone || "");
      setNotes(shipment.notes || "");

      // 1️⃣ Load order items remaining
      const items = await orderApi.getOrderItemsWithRemaining(
        shipment.order_id
      );

      // 2️⃣ Load shipment items hiện tại
      const shipmentItems = (await shipmentsApi.getItems(shipment.id)) as any[];

     const merged = items.map((item: any) => {
        const existing = shipmentItems.find(
          (s: any) => s.order_item_id === item.id
        );

        return {
          ...item,
          quantity_shipped: existing?.quantity_shipped || 0,
          batch_id: existing?.batch_id || null,
          shipment_item_id: existing?.id || null
        };
      });

      setOrderItems(merged);
      setSelectedItems(
        merged
          .filter((i: any) => i.quantity_shipped > 0)
          .map((i: any) => ({
            order_item_id: i.id,
            quantity_shipped: i.quantity_shipped,
            batch_id: i.batch_id ?? null,
            shipment_item_id: i.shipment_item_id
          }))
      );
    };

    init();
  }, [isOpen, shipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      // 1️⃣ Update shipment info
      await shipmentsApi.update(shipment.id, {
        driver_name: driverName,
        driver_phone: driverPhone,
        notes,
      });

      // 2️⃣ Sync shipment items
      const currentItems = (await shipmentsApi.getItems(shipment.id)) as any[];

      const itemsArray = Array.isArray(currentItems)
      ? currentItems
      : [];

      // Update hoặc Add
      for (const item of selectedItems) {
        const existing = itemsArray.find(
          (i: any) =>
            i.order_item_id === item.order_item_id ||
            i.order_item?.id === item.order_item_id
        );

        if (existing && existing.id) {
          await shipmentsApi.updateItem(
            shipment.id,
            existing.id,
            {
              order_item_id: item.order_item_id,
              quantity_shipped: item.quantity_shipped,
              batch_id: item.batch_id ?? null
            }
          );
        } else {
          await shipmentsApi.addItem(
            shipment.id,
            {
              order_item_id: item.order_item_id,
              quantity_shipped: item.quantity_shipped,
              batch_id: item.batch_id ?? null
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
      <form onSubmit={handleSubmit} className="p-4 space-y-4 text-black">

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border rounded">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        
        <div className="border rounded p-3 space-y-3 text-black">
          <p className="font-semibold text-sm">Chỉnh sửa sản phẩm</p>

          {orderItems.map((item: any) => (
            <div key={item.id} className="flex gap-2 items-center text-black">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.item?.name}</p>
                <p className="text-xs text-gray-500">
                  Còn lại: {item.remaining_quantity}
                </p>
              </div>

              <input
                type="number"
                min={0}
                max={item.remaining_quantity}
                value={
                  selectedItems.find(i => i.order_item_id === item.id)
                    ?.quantity_shipped || 0
                }
                className="w-20 border rounded px-2 h-9 text-black"
                onChange={(e) => {
                  const qty = Number(e.target.value);

                  setSelectedItems((prev) => {
                    const existing = prev.find(i => i.order_item_id === item.id);
                    const filtered = prev.filter(i => i.order_item_id !== item.id);

                    if (qty > 0) {
                      return [
                        ...filtered,
                        {
                          order_item_id: item.id,
                          quantity_shipped: qty,
                          batch_id: existing?.batch_id ?? null,
                          shipment_item_id: existing?.shipment_item_id
                        }
                      ];
                    }

                    return filtered;
                  });
                }}
              />

              <input
                type="text"
                placeholder="Batch ID (optional)"
                value={
                  selectedItems.find(i => i.order_item_id === item.id)
                    ?.batch_id || ""
                }
                className="w-32 border rounded px-2 h-9 text-black"
                onChange={(e) => {
                  const batch = e.target.value || null;

                  setSelectedItems(prev =>
                    prev.map(i =>
                      i.order_item_id === item.id
                        ? { ...i, batch_id: batch }
                        : i
                    )
                  );
                }}
              />
            </div>
          ))}
        </div>

        {/* DRIVER INFO */}
        <input
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="Tên tài xế"
          className="w-full border rounded px-3 h-10"
        />

        <input
          type="text"
          value={driverPhone}
          onChange={(e) => setDriverPhone(e.target.value)}
          placeholder="SĐT tài xế"
          className="w-full border rounded px-3 h-10"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú"
          className="w-full border rounded px-3 py-2"
        />

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