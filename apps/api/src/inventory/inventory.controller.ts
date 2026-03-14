import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/supabase.strategy';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryLevelsDto,
  CreateTransactionDto,
  InventoryResponse,
  LowStockItemResponse,
  TransactionResponse,
} from './dto/inventory.dto';

/**
 * Inventory Controller
 *
 * Endpoints for managing stock levels, transactions, and inventory queries.
 * All endpoints require authentication via Supabase JWT.
 */
@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('supabase'))
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ═══════════════════════════════════════════════════════════
  // INVENTORY ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /inventory - List all inventory records
   * Optionally filter by store
   */
  @Get()
  @ApiOperation({ summary: 'List all inventory records' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: Number,
    description: 'Filter by store ID',
  })
  @ApiResponse({ status: 200, description: 'List of inventory records' })
  @Roles('all')
  async findAll(
    @Query('storeId', new ParseIntPipe({ optional: true })) storeId?: number,
  ): Promise<InventoryResponse[]> {
    return this.inventoryService.findAll(storeId);
  }

  /**
   * GET /inventory/:storeId/:itemId - Get inventory for store and item
   */
  @Get(':storeId/:itemId')
  @ApiOperation({ summary: 'Get inventory for specific store and item' })
  @ApiParam({ name: 'storeId', type: Number })
  @ApiParam({ name: 'itemId', type: Number })
  @ApiResponse({ status: 200, description: 'Inventory details' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @Roles('all')
  async getInv(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<InventoryResponse> {
    return this.inventoryService.findOneByStoreAndItem(storeId, itemId);
  }

  /**
   * POST /inventory - Create new inventory record
   * Initialize stock level for a store-item combination
   */
  @Post()
  @ApiOperation({ summary: 'Create new inventory record' })
  @ApiResponse({ status: 201, description: 'Inventory created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles('coordinator', 'admin')
  async create(@Body() dto: CreateInventoryDto): Promise<InventoryResponse> {
    return this.inventoryService.create(dto);
  }

  /**
   * PUT /inventory/:id - Update min/max stock levels
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update stock min/max levels' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Inventory updated' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @Roles('coordinator', 'admin')
  async updateLevels(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryLevelsDto,
  ): Promise<InventoryResponse> {
    return this.inventoryService.updateLevels(id, dto);
  }

  /**
   * GET /inventory/low-stock - List items with low stock
   * Stock quantity < min_stock_level
   */
  @Get('low-stock')
  @ApiOperation({ summary: 'List low stock items' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: Number,
    description: 'Filter by store ID',
  })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  @Roles('coordinator', 'manager', 'admin')
  async getLowStockItems(
    @Query('storeId', new ParseIntPipe({ optional: true })) storeId?: number,
  ): Promise<LowStockItemResponse[]> {
    return this.inventoryService.getLowStockItems(storeId);
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSACTION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /inventory/transactions - List transactions
   * Optionally filter by store and/or item
   */
  @Get('transactions')
  @ApiOperation({ summary: 'List inventory transactions' })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: Number,
    description: 'Filter by store ID',
  })
  @ApiQuery({
    name: 'itemId',
    required: false,
    type: Number,
    description: 'Filter by item ID',
  })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @Roles('coordinator', 'admin')
  async getTransactions(
    @Query('storeId', new ParseIntPipe({ optional: true })) storeId?: number,
    @Query('itemId', new ParseIntPipe({ optional: true })) itemId?: number,
  ): Promise<TransactionResponse[]> {
    return this.inventoryService.getTransactions(storeId, itemId);
  }

  /**
   * POST /inventory/transactions - Create transaction
   * Records a stock movement (import, export, adjustment, etc.)
   * Updates stock quantity and checks for alerts.
   */
  @Post('transactions')
  @ApiOperation({ summary: 'Create inventory transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles('coordinator', 'ck_staff', 'admin')
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<TransactionResponse> {
    return this.inventoryService.createTransaction(dto, userId);
  }

  /**
   * GET /inventory/transactions/:id - Get transaction detail
   */
  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Roles('coordinator', 'admin')
  async getTransactionDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionResponse> {
    return this.inventoryService.getTransactionDetail(id);
  }
}
