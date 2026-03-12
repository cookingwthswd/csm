import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ProductionStatusEnum, BatchStatusEnum } from '@repo/types';

export const PRODUCTION_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const BATCH_STATUSES = ['active', 'depleted', 'expired'] as const;

export class CreatePlanDetailDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiProperty({ description: 'Quantity planned', example: 100 })
  @IsNumber()
  @IsPositive()
  quantityPlanned: number;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Start date', example: '2026-03-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date', example: '2026-03-05' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Plan details', type: [CreatePlanDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanDetailDto)
  details: CreatePlanDetailDto[];
}

export class UpdatePlanStatusDto {
  @ApiProperty({
    description: 'New plan status',
    enum: PRODUCTION_STATUSES,
  })
  @IsIn(PRODUCTION_STATUSES)
  status: ProductionStatusEnum;

  @ApiPropertyOptional({ description: 'Notes on status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Start date', example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2026-03-05' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductionDetailDto {
  @ApiProperty({ description: 'Quantity actually produced', example: 100 })
  @IsNumber()
  @Min(0)
  quantityProduced: number;
}

export class CreateBatchDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsInt()
  @IsPositive()
  itemId: number;

  @ApiProperty({ description: 'Manufacture date', example: '2026-03-01' })
  @IsDateString()
  manufactureDate: string;

  @ApiProperty({ description: 'Expiry date', example: '2026-04-01' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ description: 'Initial quantity', example: 100 })
  @IsNumber()
  @IsPositive()
  initialQuantity: number;

  @ApiPropertyOptional({ description: 'Production detail ID', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  productionDetailId?: number;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({
    description: 'Batch status',
    enum: BATCH_STATUSES,
  })
  @IsOptional()
  @IsIn(BATCH_STATUSES)
  status?: BatchStatusEnum;

  @ApiPropertyOptional({ description: 'Current quantity', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQuantity?: number;
}
