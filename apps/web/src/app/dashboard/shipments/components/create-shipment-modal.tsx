/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { AlertCircle } from "lucide-react";

export default function CreateShipmentModal({ isOpen, onClose, onSuccess, existingShipments }: any) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    const isDuplicate = existingShipments?.some(
      (s: any) => Number(s.order_id) === Number(orderId)
    );

    if (isDuplicate) {
      setError(`Đơn hàng ORD-${orderId} đã có vận đơn trong hệ thống.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await shipmentsApi.create({ orderId });

      alert("Tạo vận đơn thành công!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Không thể tạo vận đơn.";
      
      if (msg.includes("403") || msg.includes("Forbidden")) {
        setError("Bạn không có quyền thực hiện chức năng này.");
      } else if (msg.includes("already exists") || msg.includes("duplicate")) {
        setError(`Lỗi: Order ID ${orderId} đã được tạo vận đơn trước đó.`);
      } else if (msg.includes("processing")) {
        setError("Lỗi: Chỉ các đơn hàng đang ở trạng thái 'Processing' mới được phép tạo vận đơn.");
      } else {
        setError(msg || "Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (isOpen) { setOrderId(null); setError(null); } }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
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

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">
            Hệ thống sẽ tự động kiểm tra tính hợp lệ của đơn hàng trước khi tạo.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={isLoading} disabled={!orderId} className="bg-blue-600 text-white px-6">
            Xác nhận tạo
          </Button>
        </div>
      </form>
    </Modal>
  );
}