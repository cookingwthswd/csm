"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import type { OrderResponse } from "@repo/types";

interface ConfirmShipmentModalProps {
  isOpen: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onConfirm: (orderId: number, data: { review?: string; rating?: number }) => void;
  isLoading?: boolean;
}

export function ConfirmShipmentModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmShipmentModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);

  if (!order) return null;

  const handleConfirmDelivery = () => {
    setShowReviewForm(true);
  };

  const handleSubmitReview = () => {
    onConfirm(order.id, { review, rating });
    setShowReviewForm(false);
    setReview("");
    setRating(5);
  };

  const handleSkipReview = () => {
    onConfirm(order.id, {});
    setShowReviewForm(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showReviewForm ? "Leave a Review" : "Confirm Shipment Delivery"}
    >
      {!showReviewForm ? (
        <div className="space-y-6">
          {/* Order Details */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Code:</span>
                <span className="font-medium text-gray-900">{order.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Store:</span>
                <span className="font-medium text-gray-900">
                  {order.storeName || `Store ${order.storeId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-gray-900">
                  {order.totalAmount?.toFixed(2) || "0.00"} VNĐ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Order Items
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {item.itemName} x {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    {((item.unitPrice || 0) * item.quantity).toFixed(2)} VNĐ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              By confirming, you acknowledge that this order has been successfully
              delivered to your store. The order status will be updated to
              "delivered".
            </p>
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
              type="button"
              onClick={handleConfirmDelivery}
              loading={isLoading}
              className="w-full sm:w-auto"
            >
              Confirm Delivery
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Review Form */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    {star <= rating ? (
                      <span className="text-yellow-400">★</span>
                    ) : (
                      <span className="text-gray-300">★</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={4}
                placeholder="Share your experience with this delivery..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkipReview}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Skip Review
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReview}
              loading={isLoading}
              className="w-full sm:w-auto"
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
