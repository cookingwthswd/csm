/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { AlertCircle } from "lucide-react";
import { orderApi } from "@/lib/api/orders";

export default function CreateShipmentModal({ isOpen, onClose, onSuccess}: any) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 
  const [batches, setBatches] = useState<Record<number, any[]>>({});

  const loadBatches = async (itemId: number) => {
    if (batches[itemId]) return;

    try {
      const res = await shipmentsApi.getBatchesByItem(itemId);
      setBatches(prev => ({
        ...prev,
        [itemId]: res as any[]
      }));
    } catch (err) {
      console.error("Failed to load batches");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!orderId || selectedItems.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm và số lượng");
      return;
    }

    for (const selected of selectedItems) {
      const orderItem = orderItems.find((o) => o.id === selected.order_item_id);
    
      if (!orderItem) continue;
      if (selected.quantity_shipped > orderItem.remaining_quantity) {
        setError(`Sản phẩm ${orderItem.item?.name} chỉ còn ${orderItem.remaining_quantity} cái trong đơn hàng.`);
        return;
      }

      if (selected.batch_id) {
        const itemBatches = batches[orderItem.item_id] || [];
        const targetBatch = itemBatches.find(b => b.id === selected.batch_id);

        if (targetBatch && selected.quantity_shipped > targetBatch.quantity) {
          setError(`Lô ${targetBatch.batch_code} chỉ còn ${targetBatch.quantity} sản phẩm trong kho.`);
          return;
        }
      } else {
        setError(`Vui lòng chọn lô hàng cho sản phẩm ${orderItem.item?.name}`);
        return;
      }
    }

    try {
      setIsLoading(true);

      const shipmentRes = await shipmentsApi.create({
        order_id: orderId,
        driver_name: driverName,
        driver_phone: driverPhone,
        notes
      });

      const shipmentId = shipmentRes.id;

      const invalidItem = selectedItems.find((i) => {
        const orderItem = orderItems.find((o) => o.id === i.order_item_id);
        return i.quantity_shipped > orderItem.remaining_quantity;
      });

      if (invalidItem) {
        setError("Số lượng giao vượt quá số lượng còn lại của đơn hàng");
        return;
      }

      for (const item of selectedItems) {
        await shipmentsApi.addItem(shipmentId, {
          order_item_id: item.order_item_id,
          quantity_shipped: item.quantity_shipped,
          batch_id: item.batch_id ?? null
        });
      }

      alert("Tạo vận đơn thành công!");
      onSuccess?.();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const loadItems = async () => {
      const res = await orderApi.getOrderItemsWithRemaining(orderId);
      setOrderItems(res);
    };

    loadItems();
  }, [orderId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
      <div className="text-black">
      <form onSubmit={handleSubmit} className="space-y-4 p-4 text-black">
        {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Order ID *</label>
          <input
            type="number"
            value={orderId ?? ""}
            onChange={(e) => setOrderId(Number(e.target.value))}
            placeholder="Ví dụ: 1, 2, 3..."
            className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="border rounded-lg p-3 space-y-3">
          <p className="text-sm font-semibold">Chọn sản phẩm</p>

          {orderItems.map((item) => (
            <div key={item.id} className="flex gap-2 items-center text-black">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.item?.name}</p>
                <p className="text-xs text-gray-500">
                  Còn lại: {item.remaining_quantity}
                </p>
              </div>

              {/* Quantity */}
              <input
                type="number"
                placeholder="Quantity"
                min={0}
                max={item.remaining_quantity}
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
                          batch_id: existing?.batch_id ?? null
                        }
                      ];
                    }

                    return filtered;
                  });
                }}
              />

              {/* Batch ID */}
              <select
                className="w-40 border rounded px-2 h-9 text-black"
                onFocus={() => loadBatches(item.item.id)}
                onChange={(e) => {
                  const batchId = Number(e.target.value);

                  setSelectedItems((prev) => {
                    const existing = prev.find(i => i.order_item_id === item.id);
                    if (!existing) return prev;

                    return prev.map(i =>
                      i.order_item_id === item.id
                        ? { ...i, batch_id: batchId }
                        : i
                    );
                  });
                }}
              >
                <option value="">Select batch</option>

                {(batches[item.item.id] || []).map((batch) => (
                  <option key={batch.id} value={batch.id} disabled={batch.quantity <= 0}>
                    {batch.batch_code} (Remaining: {batch.quantity})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài xế</label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Nguyễn Văn A..."
            className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
          <input
            type="text"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="090..."
            className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú giao hàng..."
            className="w-full h-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={isLoading} disabled={!orderId} className="bg-blue-600 text-white px-6">
            Xác nhận
          </Button>
        </div>
      </form>
    </div>
    </Modal>
  );
}