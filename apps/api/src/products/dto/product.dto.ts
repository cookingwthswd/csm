import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * Product (Item) DTOs
 *
 * Items = Products tracked in the system (materials, semi-finished, finished)
 * Maps to `items` table in database
 */

export const ITEM_TYPES = [
  'material',
  'semi_finished',
  'finished_product',
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'pcs',
  'box',
  'can',
  'pack',
] as const;
export type ItemUnit = (typeof ITEM_UNITS)[number];

// ═══════════════════════════════════════════════════════════
// CREATE PRODUCT
// ═══════════════════════════════════════════════════════════

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Flour' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'SKU code', example: 'MAT-FLOUR-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    description: 'Unit of measurement',
    enum: ITEM_UNITS,
    example: 'kg',
  })
  @IsIn(ITEM_UNITS)
  unit: ItemUnit;

  @ApiProperty({
    description: 'Item type',
    enum: ITEM_TYPES,
    example: 'material',
  })
  @IsIn(ITEM_TYPES)
  type: ItemType;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════
// UPDATE PRODUCT
// ═══════════════════════════════════════════════════════════

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ═══════════════════════════════════════════════════════════
// QUERY FILTERS
// ═══════════════════════════════════════════════════════════

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by item type',
    enum: ITEM_TYPES,
  })
  @IsOptional()
  @IsIn(ITEM_TYPES)
  type?: ItemType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;
}
