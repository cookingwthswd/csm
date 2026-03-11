import { Controller, Get, Param } from '@nestjs/common';
import { BatchesService } from './batches.service';

@Controller('batches')
export class BatchesController {
  constructor(private readonly service: BatchesService) {}

  /**
   * GET /inventory/batches
   */
  @Get()
  getBatches() {
    return this.service.getBatches();
  }

  /**
   * GET /inventory/batches/:id
   */
  @Get(':id')
  getBatchDetail(@Param('id') id: string) {
    return this.service.getBatchDetail(Number(id));
  }

  /**
   * GET /inventory/batches/:id/transactions
   */
  @Get(':id/transactions')
  getBatchTransactions(@Param('id') id: string) {
    return this.service.getBatchTransactions(Number(id));
  }
}
