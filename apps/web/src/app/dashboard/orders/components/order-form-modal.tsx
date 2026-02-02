"use client";

import { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";
import type { CreateOrderDto, OrderResponse } from "@repo/types";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderDto) => void;
  editingOrder: OrderResponse | null;
  isLoading?: boolean;
}

export function OrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingOrder,
  isLoading = false,
}: OrderFormModalProps) {
  // Initialize form data based on editing state
  const getInitialFormData = (): CreateOrderDto => {
    if (editingOrder) {
      return {
        storeId: editingOrder.storeId,
        requestedDate: editingOrder.requestedDate,
        notes: "",
        items:
          editingOrder.items?.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })) ?? [],

      };
    }
    return {
      storeId: 1,
      requestedDate: new Date().toISOString().split("T")[0],
      notes: "",
      items: [],
    };
  };

  const [formData, setFormData] =
    useState<CreateOrderDto>(getInitialFormData());
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  const handleModalOpen = () => {
    setFormData(getInitialFormData());
    setError(null);
  };

  // Call reset when modal opens
  if (isOpen && formData.storeId !== (editingOrder?.storeId || 1)) {
    handleModalOpen();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.storeId || formData.storeId < 1) {
      setError("Please select a valid store");
      return;
    }

    if (!formData.requestedDate) {
      setError("Please select a requested date");
      return;
    }

    // Add at least one dummy item since items array is required
    const orderData: CreateOrderDto = {
      ...formData,
      items:
        formData.items.length > 0
          ? formData.items
          : [
            { itemId: 1, quantity: 1 }, // Default item
          ],
    };

    try {
      onSubmit(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOrder ? "Edit Order" : "Add Order"}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}

        <Input
          label="Store ID"
          type="number"
          value={formData.storeId}
          onChange={(e) =>
            setFormData({
              ...formData,
              storeId: parseInt(e.target.value) || 1,
            })
          }
          required
          min={1}
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requested Date
          </label>
          <input
            type="date"
            value={formData.requestedDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                requestedDate: e.target.value,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            maxLength={500}
            placeholder="Order notes..."
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {editingOrder ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
