"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal, Button } from "@/components/ui";
import { orderApi } from "@/lib/api/orders";
import type { OrderResponse, OrderStatus } from "@repo/types";
import { statusColors } from "@repo/types";
import { useEffect } from "react";

interface OrderDetailsModalProps {
  orderId: number | null;
  onClose: () => void;
}

export function OrderDetailsModal({
  orderId,
  onClose,
}: OrderDetailsModalProps) {
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderResponse>({
    queryKey: ["orders", orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: !!orderId,
  });

  const getStatusBadge = (status: OrderStatus) => {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-md font-semibold ${statusColors[status]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <Modal
      isOpen={!!orderId}
      onClose={onClose}
      title="Order Details"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-sm text-gray-500">Loading order details...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Failed to load order</p>
          <p className="text-sm text-red-600">Please try again later</p>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {order.orderCode}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Created {new Date(order.createdAt).toLocaleString('vi-vn')}
                </p>
              </div>

              {getStatusBadge(order.status as OrderStatus)}
            </div>

            {/* Created By Info */}
            {order.createdBy && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                  {order.createdBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.createdBy}</p>
                  {order.creatorRole && (
                    <p className="text-xs text-gray-600 capitalize">
                      {order.creatorRole.replace("_", " ")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Information Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard
              label="Store"
              value={order.storeName ?? `Store #${order.storeId}`}
              icon="🏪"
            />
            <InfoCard
              label="Delivery Date"
              value={
                order.deliveryDate
                  ? new Date(order.deliveryDate).toLocaleDateString()
                  : "Not scheduled"
              }
              icon="📅"
            />
            <InfoCard
              label="Total Amount"
              value={`$${order.totalAmount?.toFixed(2) ?? "0.00"}`}
              icon="💰"
              highlight
            />
            <InfoCard
              label="Last Updated"
              value={new Date(order.updatedAt).toLocaleString('vi-vn')}
              icon="🕐"
            />
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">📝</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Order Notes
                  </p>
                  <p className="mt-1 text-sm text-amber-800">{order.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Item
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {order.items.map((item) => {
                    const subtotal = (item.unitPrice ?? 0) * item.quantity;
                    console.log(item)
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.itemName}
                            </p>
                            {item.notes && (
                              <p className="mt-1 text-xs text-gray-500 italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          ${item.unitPrice?.toFixed(2) ?? "0.00"}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-700"
                    >
                      Total Amount
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-blue-600">
                      ${order.totalAmount?.toFixed(2) ?? "0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              Print Order
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// InfoCard Component
function InfoCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${
        highlight
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p
            className={`mt-1 text-lg font-semibold ${
              highlight ? "text-blue-700" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}