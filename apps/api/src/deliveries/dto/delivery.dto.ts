import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export const SHIPMENT_STATUS = [
  'preparing',
  'shipping',
  'delivered',
  'failed',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];

export class CreateShipmentDto {
  @ApiProperty({ description: 'Order ID', example: 1 })
  @IsInt()
  @IsPositive()
  orderId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddShipmentItemDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  orderItemId: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  batchId: number;

  @ApiProperty()
  @IsPositive()
  quantityShipped: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: SHIPMENT_STATUS })
  @IsEnum(SHIPMENT_STATUS)
  status: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
