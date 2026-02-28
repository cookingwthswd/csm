import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export const SHIPMENT_STATUS = [
  'pending',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];

export class CreateShipmentDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  @IsInt()
  @IsPositive()
  order_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driver_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driver_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddShipmentItemDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  order_item_id: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  batch_id: number;

  @ApiProperty()
  @IsPositive()
  quantity_shipped: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: SHIPMENT_STATUS })
  @IsEnum(SHIPMENT_STATUS)
  status: ShipmentStatus;
}
