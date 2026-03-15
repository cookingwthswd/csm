/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { shipmentsApi } from "@/lib/api/shipments";
import type { OrderStatus, ShipmentResponse, ShipmentStatus } from "@repo/types";
import CreateShipmentModal from "./components/create-shipment-modal";
import ViewShipmentModal from "./components/view-shipment-modal";
import { Pencil, Eye } from "lucide-react";
import { EditShipmentModal } from "./components/edit-shipment-modal";
import { orderApi } from "@/lib/api/orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ShipmentsPage() {

  const [searchCode, setSearchCode] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const queryClient = useQueryClient();
  const [data, setData] = useState<ShipmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentResponse | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);

    const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: OrderStatus } }) =>
      orderApi.updateStatus(id, data),

    onSuccess: () => {
      // Invalidate all queries that start with "orders"
      queryClient.invalidateQueries({ 
        queryKey: ["orders"],
        refetchType: 'all' 
      });
    },
  });

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await shipmentsApi.getAll();
      const finalData = Array.isArray(res) ? res : (res as any)?.data || [];
      setData(finalData);
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setLoading(false);
    }
  };
  // const handleDelete = async (id: number) => {
  //   if (!confirm("Bạn có chắc chắn muốn xóa vận đơn này không?")) return;
  //   try {
  //     await shipmentsApi.delete(id);
  //     alert("Xóa thành công!");
  //     fetchShipments();
  //   } catch (error: any) {
  //     alert(error.message || "Xóa thất bại");
  //   }
  // };

  const handleEdit = (shipment: ShipmentResponse) => {
    setSelectedShipment(shipment);
    setIsEditModalOpen(true);
  };

  const handleStatusChange = async (
    shipmentId: number,
    newStatus: ShipmentStatus,
    orderId: number,
  ) => {
    try {
      await shipmentsApi.updateStatus(shipmentId, { status: newStatus });
      fetchShipments();
      if (newStatus === 'shipping') {
        updateStatusMutation.mutate({ id: orderId, data: { status: 'shipping' } });
      } else if (newStatus === 'delivered') {
        updateStatusMutation.mutate({ id: orderId, data: { status: 'delivered' } });
      }
    } catch (err: any) {
      alert(err.message || "Không thể đổi trạng thái");
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const storeOptions = Array.from(
    new Set(
      data
        .map((shipment) => shipment.orders?.stores?.name)
        .filter((name): name is string => Boolean(name?.trim()))
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredData = data.filter((shipment) => {
    const shipmentCode = shipment.shipment_code?.toLowerCase() ?? "";
    const storeName = shipment.orders?.stores?.name ?? "";

    const matchesSearch = shipmentCode.includes(searchCode.trim().toLowerCase());
    const matchesStore = storeFilter ? storeName === storeFilter : true;

    return matchesSearch && matchesStore;
  });
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Shipments Management</h1>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          + Add Shipment
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Search by shipment code..."
              className="w-full md:max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full md:w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All stores</option>
              {storeOptions.map((storeName) => (
                <option key={storeName} value={storeName}>
                  {storeName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-4 font-semibold text-gray-700">Order ID</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Store</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Shipment Code</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-4 font-semibold text-gray-700">Created At</th>
              <th className="px-4 py-4 font-semibold text-gray-700 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-black">Loading...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No shipments found.</td></tr>
            ) : (
              filteredData.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200 text-black">
                      ORD-{shipment.order_id}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-black text-sm font-semibold">
                    {shipment.orders?.stores?.name ?? "-"}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-blue-700 font-bold">{shipment.shipment_code}</td>
                  <td className="px-4 py-4">
                    {shipment.status === "delivered" ? (
                      <StatusBadge status={shipment.status} />
                    ) : (
                      <select
                        value={shipment.status}
                        onChange={(e) =>
                          handleStatusChange(
                            shipment.id,
                            e.target.value as ShipmentStatus,
                            shipment.order_id
                          )
                        }
                        className="border rounded px-2 py-1 text-sm bg-white text-black"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="shipping">Shipping</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-4 text-black text-sm">
                    {new Date(shipment.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(shipment)} className="p-2 hover:bg-gray-100 rounded-lg text-blue-600" title="Edit">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setViewId(shipment.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      {/* <button onClick={() => handleDelete(shipment.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <CreateShipmentModal
          onSuccess={() => { setIsFormOpen(false); fetchShipments(); }}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
      {isEditModalOpen && selectedShipment && (
        <EditShipmentModal
          shipment={selectedShipment}
          onSuccess={() => { setIsEditModalOpen(false); fetchShipments(); }}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {viewId && (
        <ViewShipmentModal
          shipmentId={viewId}
          isOpen={!!viewId}
          onClose={() => setViewId(null)}
        />
      )}

    </div>
  );
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-sm border";
  const colorMap: Record<string, string> = {
    preparing: "bg-amber-100 text-amber-700 border-amber-200",
    shipping: "bg-blue-100 text-blue-700 border-blue-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return <span className={`${base} ${colorMap[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}