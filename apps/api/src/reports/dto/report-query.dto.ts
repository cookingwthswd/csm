import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export const REPORT_TYPES = ['orders', 'production', 'inventory', 'delivery'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const GROUP_BY_OPTIONS = ['day', 'week', 'month'] as const;
export type GroupByOption = (typeof GROUP_BY_OPTIONS)[number];

/**
 * Query params for report endpoints (orders, production, inventory, delivery)
 */
export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Report type', enum: REPORT_TYPES })
  @IsOptional()
  @IsIn(REPORT_TYPES)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  storeId?: number;

  @ApiPropertyOptional({ description: 'Group results by', enum: GROUP_BY_OPTIONS, default: 'day' })
  @IsOptional()
  @IsIn(GROUP_BY_OPTIONS)
  groupBy?: GroupByOption = 'day';
}

/**
 * Query params for export endpoint
 */
export class ExportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({ description: 'Export format', enum: ['csv', 'pdf'] })
  @IsOptional()
  @IsIn(['csv', 'pdf'])
  format?: 'csv' | 'pdf' = 'csv';
}
