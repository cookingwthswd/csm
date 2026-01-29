"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Button } from "@/components/ui";
import { storesApi } from "@/lib/api/stores";
import { productsApi } from "@/lib/api/products";
import type {
  Store,
  Product,
  CreateOrderDto as UpdateOrderDto,
  OrderResponse,
} from "@repo/types";

interface UpdateOrderModalProps {
  isOpen: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onSubmit: (orderId: number, data: UpdateOrderDto) => void;
  isLoading?: boolean;
}

type OrderItemForm = {
  itemId: number;
  quantity: number;
  notes?: string;
};

export function UpdateOrderModal({
  isOpen,
  order,
  onClose,
  onSubmit,
  isLoading = false,
}: UpdateOrderModalProps) {
  /* ---------------- queries ---------------- */
  const { data: stores } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => storesApi.getAll(),
    enabled: isOpen,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await productsApi.getAll();
      return res.data;
    },
    enabled: isOpen,
  });

  /* ---------------- form state ---------------- */
  const [storeId, setStoreId] = useState<number | null>(null);
  const [requestedDate, setRequestedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemForm[]>([]);

  /* ---------------- helpers ---------------- */
  const getProductById = (id: number) => {
    const product = products?.find((p) => p.id === id);
    return product;
  };

  const getItemPrice = (itemId: number): number => {
    if (!itemId || itemId === 0) return 0;

    const product = getProductById(itemId);
    if (!product) return 0;

    const price = product.currentPrice ?? (product as any).price ?? 0;
    return Number(price);
  };

  const addItem = () => {
    setItems([...items, { itemId: 0, quantity: 1, notes: "" }]);
  };

  const updateItem = (
    index: number,
    field: keyof OrderItemForm,
    value: number | string,
  ) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /* ---------------- total amount (display only) ---------------- */
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + getItemPrice(item.itemId) * item.quantity;
    }, 0);
  }, [items, products]);

  /* ---------------- submit ---------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !storeId) return;

    onSubmit(order.id, {
      storeId,
      requestedDate,
      notes,
      items: items.filter((i) => i.itemId && i.quantity > 0),
    });
  };

  /* ---------------- hydrate form on open ---------------- */
  useEffect(() => {
    if (!isOpen || !order) return;

    setStoreId(order.storeId);
    setRequestedDate(order.createdAt.split("T")[0]);
    setNotes(order.notes ?? "");
    setItems(
      order.items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        notes: i.notes ?? "",
      })),
    );
  }, [isOpen, order]);

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Order #${order.id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store & Date Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Store */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Store <span className="text-red-500">*</span>
            </label>
            <select
              value={storeId ?? ""}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            >
              <option value="" disabled>
                Select store
              </option>
              {stores?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requested Date */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Requested Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={requestedDate}
              readOnly
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Items
            </h3>
            <Button
              type="button"
              onClick={addItem}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No items added yet. Click "Add Item" to start.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const unitPrice = getItemPrice(item.itemId);
                const subtotal = unitPrice * item.quantity;

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    {/* Main Item Row */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-start">
                      {/* Product Select */}
                      <div className="md:col-span-4">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.itemId}
                          onChange={(e) =>
                            updateItem(index, "itemId", Number(e.target.value))
                          }
                          className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        >
                          <option value={0} disabled>
                            Select product
                          </option>
                          {products?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Unit Price
                        </label>
                        <div className="h-12 rounded-md bg-gray-50 px-3 py-2 text-right text-sm font-medium text-gray-700">
                          {item.itemId && item.itemId !== 0
                            ? `${unitPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} VNĐ`
                            : "--"}
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Subtotal
                        </label>
                        <div className="h-12 rounded-md bg-blue-50 px-3 py-2 text-right text-sm font-bold text-blue-700">
                          {item.itemId && item.itemId !== 0
                            ? `${subtotal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} VNĐ`
                            : "0.00"}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="h-12 md:col-span-2 md:pt-6 mt-[-4px]">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="h-12 w-full rounded-md bg-red-50 px-3 py-2 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          aria-label="Remove item"
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>

                    {/* Item Notes */}
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Item Notes
                      </label>
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) =>
                          updateItem(index, "notes", e.target.value)
                        }
                        placeholder="Add specific instructions for this item..."
                        className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Order Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={3}
            placeholder="Add general order instructions or notes..."
          />
        </div>

        {/* Total */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-700">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {totalAmount.toLocaleString("vi-VN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              VNĐ
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!storeId || items.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Updating..." : "Update Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}