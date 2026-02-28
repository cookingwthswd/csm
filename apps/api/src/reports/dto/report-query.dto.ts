import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportType {
  ORDERS = 'orders',
  PRODUCTION = 'production',
  INVENTORY = 'inventory',
  DELIVERY = 'delivery',
}

export enum ReportGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class ReportQueryDto {
  @ApiProperty({
    enum: ReportType,
    required: false,
    description:
      'Type of report to generate. Optional for specific report endpoints.',
  })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiProperty({
    description: 'Start date (inclusive) in YYYY-MM-DD format',
    example: '2026-01-01',
  })
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({
    description: 'End date (inclusive) in YYYY-MM-DD format',
    example: '2026-01-31',
  })
  @IsDateString()
  dateTo!: string;

  @ApiProperty({
    required: false,
    description: 'Optional store filter (for store-level analytics)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storeId?: number;

  @ApiProperty({
    enum: ReportGroupBy,
    default: ReportGroupBy.DAY,
    description: 'Grouping granularity for time-series data',
  })
  @IsOptional()
  @IsEnum(ReportGroupBy)
  groupBy: ReportGroupBy = ReportGroupBy.DAY;

  /**
   * Optional free-form search / filter keyword.
   * Can be used by specific reports for product name, SKU, etc.
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}

