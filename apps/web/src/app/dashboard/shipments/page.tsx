/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/";
import { shipmentsApi } from "@/lib/api/shipments";
import type {
  ShipmentResponse,
  ShipmentStatus,
} from "@repo/types";
import { shipmentStatusColors } from "@repo/types";
import CreateShipmentModal from "./components/create-shipment-modal";

export default function ShipmentsPage() {
  const [data, setData] = useState<ShipmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await shipmentsApi.getAll();
      const finalData = Array.isArray(res) ? res : (res as any)?.data || [];
      setData(finalData);
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Shipments Management
        </h1>

        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
        >
          + Add Shipment
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-4 font-semibold text-gray-700">ID</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Order ID</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Shipment Code</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-4 font-semibold text-gray-700 text-right">Created At</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading shipments...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500 italic">
                  No shipments found.
                </td>
              </tr>
            ) : (
              data.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-4 py-4 text-gray-600 font-medium">
                    #{shipment.id}
                  </td>
                  <td className="px-4 py-4 text-gray-900">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
                      ORD-{shipment.order_id}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-blue-700 font-semibold">
                    {shipment.shipment_code}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-sm text-right">
                    {shipment.created_at ? new Date(shipment.created_at).toLocaleString('vi-VN') : "---"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <CreateShipmentModal
          onSuccess={() => {
            setIsFormOpen(false);
            fetchShipments();
          }} 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-sm";
  
  const color = shipmentStatusColors[status] || "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span className={`${base} ${color}`}>
      {status}
    </span>
  );
}