import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AlertsService } from './alerts.service';
import { InventoryController } from './inventory.controller';
import { AlertsController } from './alerts.controller';

/**
 * Inventory Module
 *
 * Manages stock levels, inventory transactions, and automated alerts.
 *
 * Exports:
 * - InventoryService: Core inventory operations
 * - AlertsService: Alert generation and management
 *
 * Controllers:
 * - InventoryController: /inventory endpoints
 * - AlertsController: /inventory/alerts endpoints
 *
 * Dependencies:
 * - CommonModule: SupabaseService (global module)
 */
@Module({
  controllers: [InventoryController, AlertsController],
  providers: [InventoryService, AlertsService],
  exports: [InventoryService, AlertsService],
})
export class InventoryModule {}
