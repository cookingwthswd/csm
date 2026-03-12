import { Controller, Get, Param } from '@nestjs/common';
import { InventoriesService } from './inventories.service';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly service: InventoriesService) {}

  /**
   * GET /inventory
   */
  @Get()
  getInventories() {
    return this.service.getInventories();
  }

  /**
   * GET /inventory/store/:storeId
   */
  @Get('/:storeId')
  getInventoryByStore(@Param('storeId') storeId: string) {
    return this.service.getInventoryByStore(Number(storeId));
  }
}
