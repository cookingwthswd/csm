import { z } from "zod";

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const SHIPMENT_STATUS_VALUES = [
  "pending",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
] as const;

export const ShipmentStatusSchema = z.enum(
  SHIPMENT_STATUS_VALUES
);

export type ShipmentStatus =
  z.infer<typeof ShipmentStatusSchema>;

export const shipmentStatusColors: Record<
  ShipmentStatus,
  string
> = {
  pending: "bg-gray-100 text-gray-800",
  preparing: "bg-yellow-100 text-yellow-800",
  shipping: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const CreateShipmentDto = z.object({
  order_id: z.number().int().positive(),
  driver_name: z.string().optional().nullable(),
  driver_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateShipmentDto =
  z.infer<typeof CreateShipmentDto>;

export const UpdateShipmentDto = z.object({
  driver_name: z.string().optional().nullable(),
  driver_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateShipmentDto = z.infer<typeof UpdateShipmentDto>;

export const UpdateShipmentStatusDto = z.object({
  driver_name: z.string().optional().nullable(),
  driver_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: ShipmentStatusSchema,
});

export type UpdateShipmentStatusDto =
  z.infer<typeof UpdateShipmentStatusDto>;

export const ShipmentResponse = z.object({
  id: z.number(),
  order_id: z.number(),
  shipment_code: z.string(),
  driver_name: z.string().optional().nullable(),
  driver_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: ShipmentStatusSchema,
  shipped_date: z.string().nullable(),
  delivered_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ShipmentResponse =
  z.infer<typeof ShipmentResponse>;

  export interface CreateShipmentItemPayload {
  order_item_id: number;
  batch_id?: number;
  quantity_shipped: number;
  note?: string;
}