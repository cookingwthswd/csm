import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsPositive, ValidateNested } from 'class-validator';

export class RecipeDetailDto {
  @ApiProperty({ description: 'Material ID', example: 2 })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({ description: 'Quantity required to make 1 unit of product', example: 0.5 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class UpdateRecipeDto {
  @ApiProperty({ description: 'Product ID (must be type: product)', example: 1 })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ description: 'Recipe materials', type: [RecipeDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeDetailDto)
  materials: RecipeDetailDto[];
}
