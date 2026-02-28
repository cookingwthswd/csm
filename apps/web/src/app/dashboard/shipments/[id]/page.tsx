"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { shipmentsApi } from "@/lib/api/shipments";
import { shipmentItemsApi } from "@/lib/api/shipment-items";
import type {
  ShipmentResponse,
  ShipmentItemResponse,
} from "@repo/types";

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [shipment, setShipment] =
    useState<ShipmentResponse | null>(null);
  const [items, setItems] =
    useState<ShipmentItemResponse[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const s = await shipmentsApi.getById(
        Number(id)
      );
      const i =
        await shipmentItemsApi.getByShipmentId(
          Number(id)
        );
      setShipment(s);
      setItems(i.data);
    };
    fetch();
  }, [id]);

  if (!shipment) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">
          Shipment {shipment.shipment_code}
        </h2>
        <p>Status: {shipment.status}</p>
        <p>Order ID: {shipment.order_id}</p>
      </div>

      <div className="bg-white p-6 shadow rounded">
        <h3 className="text-lg mb-4">
          Shipment Items
        </h3>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th>Item</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
