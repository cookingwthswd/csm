import { z } from "zod";

export const CreateShipmentItemDto = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export type CreateShipmentItemDto =
  z.infer<typeof CreateShipmentItemDto>;

export const UpdateShipmentItemDto = z.object({
  quantity: z.number().int().positive(),
});

export type UpdateShipmentItemDto =
  z.infer<typeof UpdateShipmentItemDto>;

export const ShipmentItemResponse = z.object({
  id: z.number(),
  shipmentId: z.number(),
  productId: z.number(),
  productName: z.string(),
  quantity: z.number(),
});

export type ShipmentItemResponse =
  z.infer<typeof ShipmentItemResponse>;
