import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import { AlertResponse, ResolveAlertDto, AlertCountResponse, ALERT_TYPE, ALERT_STATUS } from './dto/inventory.dto';

/**
 * Alerts Service
 *
 * Manages inventory alerts:
 * - Auto-creates alerts on low stock, out of stock
 * - Checks for expiring batches (scheduled via cron)
 * - Provides alert resolution workflow
 * - Provides alert statistics
 */
@Injectable()
export class AlertsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Check inventory and create alerts if conditions met
   * Called when stock levels change
   *
   * @param storeId Store ID (required for stock alerts, null for batch alerts)
   * @param itemId Item ID
   */
  async checkAndCreate(storeId: number, itemId: number): Promise<void> {
    try {
      const { data: inv, error } = await this.supabase.client
        .from('inventory')
        .select('quantity, min_stock_level, max_stock_level')
        .eq('store_id', storeId)
        .eq('item_id', itemId)
        .single();

      if (error || !inv) {
        console.warn(`[AlertsService] Inventory not found for store ${storeId}, item ${itemId}`);
        return;
      }

      // Check for out of stock
      if (inv.quantity <= 0) {
        await this.createOrResolveAlert(
          storeId,
          itemId,
          ALERT_TYPE.OUT_OF_STOCK,
          `Item is out of stock`
        );
      }
      // Check for low stock
      else if (inv.quantity < inv.min_stock_level) {
        const shortage = inv.min_stock_level - inv.quantity;
        await this.createOrResolveAlert(
          storeId,
          itemId,
          ALERT_TYPE.LOW_STOCK,
          `Stock level is low. Current: ${inv.quantity}, Min required: ${inv.min_stock_level}. Shortage: ${shortage} units`,
          { shortage }
        );
      }
      // Stock is back to normal - resolve any existing low/out-of-stock alerts
      else {
        await this.resolveAlertsByType(storeId, itemId, [ALERT_TYPE.LOW_STOCK, ALERT_TYPE.OUT_OF_STOCK]);
      }
    } catch (error) {
      console.error(`[AlertsService] checkAndCreate failed:`, error);
      throw error;
    }
  }

  /**
   * Check for expiring batches (scheduled cron job)
   * Creates alerts for batches expiring within specified days
   *
   * @param expiringInDays Days until expiry to trigger alert (default: 7)
   */
  async checkExpiringBatches(expiringInDays: number = 7): Promise<number> {
    try {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + expiringInDays);

      const { data: batches, error } = await this.supabase.client
        .from('batches')
        .select(
          `
          id,
          item_id,
          items!item_id(name, sku),
          expiry_date,
          current_quantity,
          status
        `
        )
        .eq('status', 'active')
        .lte('expiry_date', expiryThreshold.toISOString())
        .gt('expiry_date', new Date().toISOString()); // Not already expired

      if (error) {
        console.error('[AlertsService] checkExpiringBatches query error:', error);
        throw error;
      }

      let alertsCreated = 0;

      for (const batch of batches || []) {
        const daysUntilExpiry = Math.ceil(
          (new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        const message = `Batch ${batch.id} expiring in ${daysUntilExpiry} days (${batch.expiry_date}). Qty: ${batch.current_quantity}`;
        
        const created = await this.createOrResolveAlert(
          null, // No specific store for batch alerts
          batch.item_id,
          ALERT_TYPE.EXPIRING_SOON,
          message,
          { batchId: batch.id, daysUntilExpiry }
        );

        if (created) alertsCreated++;
      }

      console.log(`[AlertsService] Created ${alertsCreated} expiring batch alerts`);
      return alertsCreated;
    } catch (error) {
      console.error('[AlertsService] checkExpiringBatches failed:', error);
      throw error;
    }
  }

  /**
   * Get all unresolved alerts
   */
  async findUnresolved() {
    const { data, error } = await this.supabase.client
      .from('alerts')
      .select(
        `
        id,
        type,
        status,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        batch_id,
        message,
        metadata,
        created_at,
        resolved_at
      `
      )
      .neq('status', ALERT_STATUS.RESOLVED)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AlertsService] findUnresolved:', error);
      throw new InternalServerErrorException('Failed to fetch alerts');
    }

    return (data || []).map((alert) => this.mapAlertResponse(alert));
  }

  /**
   * Get alert count by status and type
   */
  async getAlertCount(): Promise<AlertCountResponse> {
    const { data, error } = await this.supabase.client
      .from('alerts')
      .select('type, status')
      .neq('status', ALERT_STATUS.RESOLVED);

    if (error) {
      console.error('[AlertsService] getAlertCount:', error);
      throw new InternalServerErrorException('Failed to count alerts');
    }

    const byType: Record<string, number> = {};
    let total = 0;

    for (const alert of data || []) {
      total++;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    }

    return { total, byType };
  }

  /**
   * Resolve an alert
   */
  async resolve(id: number, dto?: ResolveAlertDto): Promise<AlertResponse> {
    const { data, error } = await this.supabase.client
      .from('alerts')
      .update({
        status: ALERT_STATUS.RESOLVED,
        resolved_at: new Date().toISOString(),
        resolution_note: dto?.note || null,
      })
      .eq('id', id)
      .select(
        `
        id,
        type,
        status,
        store_id,
        stores!store_id(name),
        item_id,
        items!item_id(name, sku),
        batch_id,
        message,
        metadata,
        created_at,
        resolved_at
      `
      )
      .single();

    if (error || !data) {
      throw new NotFoundException(`Alert #${id} not found`);
    }

    return this.mapAlertResponse(data);
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────

  /**
   * Create alert if it doesn't exist, or update if it does
   * Returns true if created, false if already exists
   */
  private async createOrResolveAlert(
    storeId: number | null,
    itemId: number,
    type: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if alert already exists
      let query = this.supabase.client
        .from('alerts')
        .select('id, status')
        .eq('type', type)
        .eq('item_id', itemId)
        .neq('status', ALERT_STATUS.RESOLVED);

      if (storeId !== null) {
        query = query.eq('store_id', storeId);
      } else {
        query = query.is('store_id', null);
      }

      const { data: existing } = await query;

      if (existing && existing.length > 0) {
        // Alert already exists - don't create duplicate
        return false;
      }

      // Create new alert
      const { error } = await this.supabase.client.from('alerts').insert({
        type,
        status: ALERT_STATUS.UNRESOLVED,
        store_id: storeId,
        item_id: itemId,
        message,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[AlertsService] Failed to create alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AlertsService] createOrResolveAlert error:', error);
      return false;
    }
  }

  /**
   * Resolve all alerts of specific types for a store-item combo
   */
  private async resolveAlertsByType(
    storeId: number,
    itemId: number,
    types: string[]
  ): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('alerts')
        .update({
          status: ALERT_STATUS.RESOLVED,
          resolved_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('item_id', itemId)
        .in('type', types)
        .neq('status', ALERT_STATUS.RESOLVED);

      if (error) {
        console.error('[AlertsService] Failed to resolve alerts:', error);
      }
    } catch (error) {
      console.error('[AlertsService] resolveAlertsByType error:', error);
    }
  }

  private mapAlertResponse(alert: any): AlertResponse {
    return {
      id: alert.id,
      type: alert.type,
      status: alert.status,
      storeId: alert.store_id,
      storeName: alert.stores?.name || null,
      itemId: alert.item_id,
      itemName: alert.items?.name || 'Unknown Item',
      itemSku: alert.items?.sku || 'N/A',
      batchId: alert.batch_id,
      message: alert.message,
      metadata: alert.metadata,
      createdAt: new Date(alert.created_at).toISOString(),
      resolvedAt: alert.resolved_at
        ? new Date(alert.resolved_at).toISOString()
        : null,
    };
  }
}
