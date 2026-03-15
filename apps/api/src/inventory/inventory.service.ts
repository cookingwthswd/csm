/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import { AlertsService } from './alerts.service';
import {
  CreateInventoryDto,
  UpdateInventoryLevelsDto,
  InventoryResponse,
  LowStockItemResponse,
  CreateTransactionDto,
  TransactionResponse,
} from './dto/inventory.dto';

/**
 * Inventory Service
 *
 * Manages stock levels, inventory transactions, and alert creation.
 * Works closely with AlertsService to monitor stock conditions.
 *
 * Key responsibilities:
 * - CRUD operations for inventory records
 * - Create transactions + update stock atomically
 * - Trigger alerts on stock changes
 */
@Injectable()
export class InventoryService {
  constructor(
    private supabase: SupabaseService,
    private alertsService: AlertsService,
  ) {}

  /**
   * List all inventory records across stores with item details
   */
  async findAll(storeId?: number) {
    let query = this.supabase.client.from('inventory').select(
      `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku, unit),
        quantity,
        min_stock_level,
        max_stock_level,
        updated_at
      `,
    );

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('updated_at', {
      ascending: false,
    });

    if (error) {
      console.error('[InventoryService] findAll:', error);
      throw new InternalServerErrorException('Failed to fetch inventory');
    }

    return this.mapInventoryResponse(data || []);
  }

  /**
   * Get inventory for a specific store and item
   */
  async findOneByStoreAndItem(storeId: number, itemId: number) {
    const { data, error } = await this.supabase.client
      .from('inventory')
      .select(
        `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku, unit),
        quantity,
        min_stock_level,
        max_stock_level,
        updated_at
      `,
      )
      .eq('store_id', storeId)
      .eq('item_id', itemId)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Inventory not found for store #${storeId}, item #${itemId}`,
      );
    }

    return this.mapInventorySingleResponse(data);
  }

  /**
   * Create a new inventory record
   * Initializes stock level for a store-item combination
   */
  async create(dto: CreateInventoryDto): Promise<InventoryResponse> {
    // Check if store exists
    const { data: store, error: storeError } = await this.supabase.client
      .from('stores')
      .select('id')
      .eq('id', dto.storeId)
      .single();

    if (storeError || !store) {
      throw new BadRequestException(`Store #${dto.storeId} not found`);
    }

    // Check if item exists
    const { data: item, error: itemError } = await this.supabase.client
      .from('items')
      .select('id')
      .eq('id', dto.itemId)
      .single();

    if (itemError || !item) {
      throw new BadRequestException(`Item #${dto.itemId} not found`);
    }

    // Check if already exists
    const { data: existing } = await this.supabase.client
      .from('inventory')
      .select('id')
      .eq('store_id', dto.storeId)
      .eq('item_id', dto.itemId)
      .single();

    if (existing) {
      throw new BadRequestException(
        `Inventory already exists for store #${dto.storeId}, item #${dto.itemId}`,
      );
    }

    // Validate min/max levels
    if (dto.minStockLevel > dto.maxStockLevel) {
      throw new BadRequestException(
        'Min stock level cannot be greater than max stock level',
      );
    }

    // Create inventory record
    const { data, error } = await this.supabase.client
      .from('inventory')
      .insert({
        store_id: dto.storeId,
        item_id: dto.itemId,
        quantity: dto.quantity,
        min_stock_level: dto.minStockLevel,
        max_stock_level: dto.maxStockLevel,
      })
      .select(
        `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku, unit),
        quantity,
        min_stock_level,
        max_stock_level,
        updated_at
      `,
      )
      .single();

    if (error) {
      console.error('[InventoryService] create:', error);
      throw new InternalServerErrorException('Failed to create inventory');
    }

    return this.mapInventorySingleResponse(data);
  }

  /**
   * Update min/max stock levels for an inventory record
   */
  async updateLevels(id: number, dto: UpdateInventoryLevelsDto) {
    // Validate if provided
    if (
      dto.minStockLevel !== undefined &&
      dto.maxStockLevel !== undefined &&
      dto.minStockLevel > dto.maxStockLevel
    ) {
      throw new BadRequestException(
        'Min stock level cannot be greater than max stock level',
      );
    }

    const updateData: Record<string, number> = {};
    if (dto.minStockLevel !== undefined) {
      updateData.min_stock_level = dto.minStockLevel;
    }
    if (dto.maxStockLevel !== undefined) {
      updateData.max_stock_level = dto.maxStockLevel;
    }

    const { data, error } = await this.supabase.client
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku, unit),
        quantity,
        min_stock_level,
        max_stock_level,
        updated_at
      `,
      )
      .single();

    if (error || !data) {
      throw new NotFoundException(`Inventory #${id} not found`);
    }

    return this.mapInventorySingleResponse(data);
  }

  /**
   * Get all low stock items (quantity < min_stock_level)
   */
  async getLowStockItems(storeId?: number): Promise<LowStockItemResponse[]> {
    let query = this.supabase.client.from('inventory').select(
      `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        quantity,
        min_stock_level,
        updated_at
      `,
    );

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('quantity', {
      ascending: true,
    });

    if (error) {
      console.error('[InventoryService] getLowStockItems:', error);
      throw new InternalServerErrorException('Failed to fetch low stock items');
    }

    // Filter client-side: quantity < min_stock_level
    return (data || [])
      .filter((inv: any) => inv.quantity < inv.min_stock_level)
      .map((inv: any) => ({
        id: inv.id,
        storeId: inv.store_id,
        storeName: inv.stores?.name || 'Unknown Store',
        itemId: inv.item_id,
        itemName: inv.items?.name || 'Unknown Item',
        itemSku: inv.items?.sku || 'N/A',
        quantity: inv.quantity,
        minStockLevel: inv.min_stock_level,
        shortage: inv.min_stock_level - inv.quantity,
        lastUpdated: new Date(inv.updated_at).toISOString(),
      }));
  }

  /**
   * Create inventory transaction (import/export/adjustment/etc)
   *
   * Steps:
   * 1. Insert transaction record (audit trail)
   * 2. Update inventory quantity via RPC
   * 3. Check and create alerts if needed
   */
  async createTransaction(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionResponse> {
    // Validate store exists
    const { data: store } = await this.supabase.client
      .from('stores')
      .select('id')
      .eq('id', dto.storeId)
      .single();

    if (!store) {
      throw new BadRequestException(`Store #${dto.storeId} not found`);
    }

    // Validate item exists
    const { data: item } = await this.supabase.client
      .from('items')
      .select('id')
      .eq('id', dto.itemId)
      .single();

    if (!item) {
      throw new BadRequestException(`Item #${dto.itemId} not found`);
    }

    // Insert transaction record
    const { data: tx, error: txError } = await this.supabase.client
      .from('inventory_transactions')
      .insert({
        store_id: dto.storeId,
        item_id: dto.itemId,
        batch_id: dto.batchId || null,
        quantity_change: dto.quantityChange,
        transaction_type: dto.type,
        reference_type: dto.referenceType || null,
        reference_id: dto.referenceId || null,
        note: dto.note || null,
        created_by: userId,
      })
      .select(
        `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        batch_id,
        quantity_change,
        transaction_type,
        reference_type,
        reference_id,
        note,
        created_by,
        created_at
      `,
      )
      .single();

    if (txError) {
      console.error('[InventoryService] createTransaction insert:', txError);
      throw new InternalServerErrorException(
        'Failed to create transaction record',
      );
    }

    // Update inventory via RPC (upsert pattern)
    const { error: updateError } = await this.supabase.client.rpc(
      'update_inventory_stock',
      {
        p_store_id: dto.storeId,
        p_item_id: dto.itemId,
        p_quantity_change: dto.quantityChange,
      },
    );

    if (updateError) {
      console.error('[InventoryService] update stock RPC:', updateError);
      // Transaction record exists but stock update failed - this is an error state
      throw new InternalServerErrorException(
        'Failed to update stock quantity. Transaction record was created but stock may be inconsistent.',
      );
    }

    // Check and create alerts if needed
    try {
      await this.alertsService.checkAndCreate(dto.storeId, dto.itemId);
    } catch (alertError) {
      console.error('[InventoryService] alert check failed:', alertError);
      // Don't fail the transaction if alerts fail, but log it
    }

    return this.mapTransactionResponse(tx);
  }

  /**
   * Get transaction history for a store/item
   */
  async getTransactions(storeId?: number, itemId?: number) {
    let query = this.supabase.client.from('inventory_transactions').select(
      `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        batch_id,
        quantity_change,
        transaction_type,
        reference_type,
        reference_id,
        note,
        created_by,
        created_at
      `,
    );

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('[InventoryService] getTransactions:', error);
      throw new InternalServerErrorException('Failed to fetch transactions');
    }

    return (data || []).map((tx: any) => this.mapTransactionResponse(tx));
  }

  /**
   * Get single transaction detail
   */
  async getTransactionDetail(id: number): Promise<TransactionResponse> {
    const { data, error } = await this.supabase.client
      .from('inventory_transactions')
      .select(
        `
        id,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        batch_id,
        quantity_change,
        transaction_type,
        reference_type,
        reference_id,
        note,
        created_by,
        created_at
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    return this.mapTransactionResponse(data);
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────

  private mapInventoryResponse(data: any[]): InventoryResponse[] {
    return data.map((inv) => this.mapInventorySingleResponse(inv));
  }

  private mapInventorySingleResponse(inv: any): InventoryResponse {
    return {
      id: inv.id,
      storeId: inv.store_id,
      storeName: inv.stores?.name || 'Unknown Store',
      itemId: inv.item_id,
      itemName: inv.items?.name || 'Unknown Item',
      itemSku: inv.items?.sku || 'N/A',
      quantity: inv.quantity,
      unit: inv.items?.unit || 'unit',
      minStockLevel: inv.min_stock_level,
      maxStockLevel: inv.max_stock_level,
      isLowStock: inv.quantity < inv.min_stock_level,
      lastUpdated: new Date(inv.updated_at).toISOString(),
    };
  }

  private mapTransactionResponse(tx: any): TransactionResponse {
    return {
      id: tx.id,
      storeId: tx.store_id,
      storeName: tx.stores?.name || 'Unknown Store',
      itemId: tx.item_id,
      itemName: tx.items?.name || 'Unknown Item',
      itemSku: tx.items?.sku || 'N/A',
      batchId: tx.batch_id,
      quantityChange: tx.quantity_change,
      type: tx.transaction_type,
      referenceType: tx.reference_type,
      referenceId: tx.reference_id,
      note: tx.note,
      createdBy: tx.created_by,
      createdAt: new Date(tx.created_at).toISOString(),
    };
  }
}
