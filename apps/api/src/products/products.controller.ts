/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  ITEM_TYPES,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/**
 * Products Controller
 *
 * CRUD endpoints for products (items table).
 * Types: material, semi_finished, finished_product
 */
@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products - List products with pagination and filters
   */
  @Get()
  @ApiOperation({ summary: 'List products with pagination and filters' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'categoryId', type: Number, required: false })
  @ApiQuery({ name: 'type', enum: ITEM_TYPES, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  /**
   * GET /products/:id - Get product by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * POST /products - Create new product
   */
  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  @Roles('admin', 'manager')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * PUT /products/:id - Update product
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  @Roles('admin', 'manager')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  /**
   * DELETE /products/:id - Deactivate product
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate product (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product deactivated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
