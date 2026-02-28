/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./client";
import type {
  ShipmentResponse,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  CreateShipmentItemPayload,
} from "@repo/types";
import type { PaginationMeta } from "@repo/types";

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UpdateShipmentPayload {
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
};


/**
 * Shipments API Service
 */
export const shipmentsApi = {
  /**
   * Get shipments (with optional pagination)
   */
  getAll: (query?: { page?: number; limit?: number; status?: string }) => {
    const params = new URLSearchParams();

    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.status) params.set("status", query.status);

    const queryString = params.toString();

    return api.get<PaginatedResponse<ShipmentResponse>>(
      `/shipments${queryString ? `?${queryString}` : ""}`
    );
  },

  /**
   * Get shipment by ID
   */
  getById: async (id: number) => {
    return await api.get(`/shipments/${id}`);
  },

  /**
   * Create shipment
   */
  create: (data: CreateShipmentDto) =>
    api.post<ShipmentResponse>("/shipments", data),

  /**
   * Update shipment
   */
  update: async (id: number, payload: UpdateShipmentPayload) => {
    return api.patch<ShipmentResponse>(`/shipments/${id}`, payload);
  },

  /**
   * Update shipment status
   */
  updateStatus: (
    id: number,
    data: UpdateShipmentStatusDto
  ) =>
    api.patch<ShipmentResponse>(
      `/shipments/${id}/status`,
      data
    ),

    // /**
    //  * Delete shipment
    //   */
    //  delete: (id: number): Promise<void> =>
    // api.delete<void>(`/shipments/${id}`),

  addItem: (
    shipmentId: number,
    data: CreateShipmentItemPayload
  ) =>
    api.post(
      `/shipments/${shipmentId}/items`,
      data
    ),

  updateItem: (
    shipmentId: number,
    itemId: number,
    data: CreateShipmentItemPayload
  ) =>
    api.patch(
      `/shipments/${shipmentId}/items/${itemId}`,
      data
    ),

  getItems: (shipmentId: number) =>
    api.get(`/shipments/${shipmentId}/items`),

};