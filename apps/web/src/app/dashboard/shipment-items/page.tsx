"use client";
import { api } from "@/lib/api";
import type {
  ShipmentItemResponse,
} from "@repo/types";
import type { PaginationMeta } from "@repo/types";

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Shipment Items API Service
 */
export const shipmentItemsApi = {
  /**
   * Get shipment items by shipment ID
   */
  getByShipmentId: (
    shipmentId: number,
    query?: { page?: number; limit?: number }
  ) => {
    const params = new URLSearchParams();

    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));

    const queryString = params.toString();

    return api.get<PaginatedResponse<ShipmentItemResponse>>(
      `/shipment-items/shipment/${shipmentId}${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  /**
   * Get shipment item by ID
   */
  getById: (id: number) =>
    api.get<ShipmentItemResponse>(
      `/shipment-items/${id}`
    ),
};
