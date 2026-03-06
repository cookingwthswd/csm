import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { AlertsService } from './alerts.service';
import { AlertResponse, ResolveAlertDto, AlertCountResponse } from './dto/inventory.dto';

/**
 * Alerts Controller
 *
 * Endpoints for managing inventory alerts.
 * Alerts are auto-generated when stock conditions trigger:
 * - Out of stock: quantity <= 0
 * - Low stock: quantity < min_stock_level
 * - Expiring soon: batch expiring within 7 days
 *
 * All endpoints require authentication via Supabase JWT.
 */
@ApiTags('inventory-alerts')
@ApiBearerAuth()
@UseGuards(AuthGuard('supabase'))
@Controller('inventory/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * GET /inventory/alerts - List all unresolved alerts
   */
  @Get()
  @ApiOperation({ summary: 'List unresolved alerts' })
  @ApiResponse({ status: 200, description: 'List of unresolved alerts' })
  @Roles('all')
  async findUnresolved(): Promise<AlertResponse[]> {
    return this.alertsService.findUnresolved();
  }

  /**
   * GET /inventory/alerts/count - Get count of unresolved alerts by type
   */
  @Get('count')
  @ApiOperation({ summary: 'Get unresolved alert count' })
  @ApiResponse({ status: 200, description: 'Alert count by type' })
  @Roles('all')
  async getAlertCount(): Promise<AlertCountResponse> {
    return this.alertsService.getAlertCount();
  }

  /**
   * PUT /inventory/alerts/:id/resolve - Resolve an alert
   * Mark alert as resolved and optionally add a resolution note
   */
  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @Roles('coordinator', 'admin')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto?: ResolveAlertDto
  ): Promise<AlertResponse> {
    return this.alertsService.resolve(id, dto);
  }
}
