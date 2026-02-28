/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { shipmentsApi } from "@/lib/api/shipments";

interface Props {
  shipmentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewShipmentModal({ 
  shipmentId,
  isOpen,
  onClose,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !shipmentId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await shipmentsApi.getById(shipmentId);
        setData(res);
      } catch (err) {
        console.error("Failed to fetch shipment detail", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, shipmentId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Shipment Detail`}
    >
      <div className="p-5 space-y-6 text-black">

        {loading && <p>Loading...</p>}

        {!loading && data && (
          <>
            {/* ==== SHIPMENT INFO ==== */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold">
                {data.shipment_code}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>
                  <p className="font-semibold">Order</p>
                  <p>{data.orders?.order_code}</p>
                </div>

                <div>
                  <p className="font-semibold">Store</p>
                  <p>{data.orders?.stores?.name}</p>
                  <p className="text-xs text-gray-500">
                    {data.orders?.stores?.address}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Status</p>
                  <p className="capitalize">{data.status}</p>
                </div>

                <div>
                  <p className="font-semibold">Driver</p>
                  <p>{data.driver_name || "-"}</p>
                  <p className="text-xs text-gray-500">
                    {data.driver_phone || "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Shipped Date</p>
                  <p>
                    {data.shipped_date
                      ? new Date(data.shipped_date).toLocaleString("vi-VN")
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Delivered Date</p>
                  <p>
                    {data.delivered_date
                      ? new Date(data.delivered_date).toLocaleString("vi-VN")
                      : "-"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="font-semibold">Notes</p>
                  <p>{data.notes || "-"}</p>
                </div>
              </div>
            </div>

            {/* ==== ITEMS ==== */}
            <div>
              <h3 className="font-semibold mb-3 border-t pt-4">
                Shipment Items
              </h3>

              <div className="space-y-3">
                {data.shipment_items?.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No items found
                  </p>
                )}

                {data.shipment_items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">
                        {item.order_items?.items?.name}
                      </p>

                      <span className="font-bold">
                        x{item.quantity_shipped}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      Batch: {item.batches?.batch_code || "-"} |
                      Exp:{" "}
                      {item.batches?.expiry_date
                        ? new Date(item.batches.expiry_date).toLocaleDateString("vi-VN")
                        : "-"}
                    </div>

                    {item.note && (
                      <p className="text-xs mt-1">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
