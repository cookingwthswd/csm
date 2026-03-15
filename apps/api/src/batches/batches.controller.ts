import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { BatchesService } from './batches.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';

@ApiTags('batches')
@ApiBearerAuth()
@Controller('batches')
export class BatchesController {
  constructor(private readonly service: BatchesService) {}

  /**
   * GET /inventory/batches
   */
  @Get()
  @ApiOperation({ summary: 'List all batches' })
  @ApiResponse({ status: 200, description: 'List of batches' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  getBatches() {
    return this.service.getBatches();
  }

  /**
   * GET /inventory/batches/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get batch detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Batch detail' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  getBatchDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBatchDetail(id);
  }

  /**
   * GET /inventory/batches/:id/transactions
   */
  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get batch transactions' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Batch transactions' })
  @Roles('admin', 'manager', 'ck_staff', 'store_staff', 'coordinator')
  getBatchTransactions(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBatchTransactions(id);
  }

  /**
   * POST /batches
   */
  @Post()
  @ApiOperation({ summary: 'Create batch' })
  @ApiResponse({ status: 201, description: 'Batch created' })
  @Roles('admin', 'manager', 'ck_staff')
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  /**
   * PUT /batches/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update batch' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Batch updated' })
  @Roles('admin', 'manager', 'ck_staff')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBatchDto) {
    return this.service.update(id, dto);
  }
}
