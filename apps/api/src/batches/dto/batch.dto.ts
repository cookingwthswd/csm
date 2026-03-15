import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const BATCH_STATUSES = ['active', 'expired', 'depleted'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export class CreateBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  batch_code?: string;

  @IsInt()
  @Min(1)
  item_id: number;

  @IsOptional()
  @IsDateString()
  manufacture_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsInt()
  @Min(0)
  initial_quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  current_quantity?: number;

  @IsOptional()
  @IsIn(BATCH_STATUSES)
  status?: BatchStatus;
}

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  batch_code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;

  @IsOptional()
  @IsDateString()
  manufacture_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  initial_quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  current_quantity?: number;

  @IsOptional()
  @IsIn(BATCH_STATUSES)
  status?: BatchStatus;
}
