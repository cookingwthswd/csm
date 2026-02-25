/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { AlertCircle, Calendar } from "lucide-react";

export function EditShipmentModal({ shipment, isOpen, onClose, onSuccess }: any) {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm format ngày tháng để hiển thị
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  useEffect(() => {
    if (isOpen && shipment) {
      setDriverName(shipment.driver_name || "");
      setDriverPhone(shipment.driver_phone || "");
      setNotes(shipment.notes || "");
      setError(null);
    }
  }, [isOpen, shipment]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await shipmentsApi.update(shipment.id, {
        driverName,
        driverPhone,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chỉnh sửa vận đơn: ${shipment?.shipment_code}`}>
      <form onSubmit={handleUpdate} className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Thông tin cố định - Read Only */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Mã Đơn Hàng</label>
            <p className="text-sm font-semibold">ORD-{shipment?.order_id}</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Trạng thái</label>
            <p className="text-sm font-semibold capitalize text-blue-600">{shipment?.status}</p>
          </div>
        </div>

        {/* Các trường có thể chỉnh sửa */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài xế</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Nguyễn Văn A..."
              className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="090..."
              className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú giao hàng cho tài xế..."
              className="w-full h-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Phần hiển thị thời gian tự động (Read Only) */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={14} />
            <span>Thông tin lộ trình (Tự động cập nhật)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-orange-50/50 rounded border border-orange-100">
              <span className="block text-[10px] text-orange-600 font-bold uppercase">Ngày xuất kho</span>
              <span className="text-xs">{formatDate(shipment?.shipped_date)}</span>
            </div>
            <div className="p-2 bg-green-50/50 rounded border border-green-100">
              <span className="block text-[10px] text-green-600 font-bold uppercase">Ngày hoàn thành</span>
              <span className="text-xs">{formatDate(shipment?.delivered_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            type="submit" 
            loading={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}