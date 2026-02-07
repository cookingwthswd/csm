/* eslint-disable prettier/prettier */
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
import { Roles, CurrentUser } from '../auth';
import { UserRoleEnum } from '../users/dto/user.dto';
import {
  AddShipmentItemDto,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/delivery.dto';
import { DeliveriesService } from './deliveries.service';
import type { AuthUser } from '../auth';

/**
 * Deliveries Controller
 * 
 * Manages shipments, shipment items, and deliver status tracking
 */
@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  /**
   * GET /deliveries - List shipments
   */
  @Get()
  @ApiOperation({ summary: 'List shipments' })
  @ApiResponse({ status: 200, description: 'List of shipments' })
  findAll() {
    return this.service.findAll();
  }

  /**
   * GET /deliveries/:id - Shipment detail
   */
  @Get(':id')
  @ApiOperation({ summary: 'Shipment detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Shipment details' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  /**
   * POST /deliveries - Create shipment from order
   */
  @Post()
  @ApiOperation({ summary: 'Create shipment from order' })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.COORDINATOR)
  create(@Body() dto: CreateShipmentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  /**
   * PUT /deliveries/:id/status - Update shipment status
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.COORDINATOR)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  /**
   * GET /deliveries/:id/items - List shipment items
   */
  @Get(':id/items')
  @ApiOperation({ summary: 'List shipment items' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'List of shipment items' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  findItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItems(id);
  }

  /**
   * POST /deliveries/:id/items - Add shipment item (with batch)
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Add shipment item (with batch)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Shipment item added' })
  @ApiResponse({ status: 400, description: 'Invalid batch or quantity' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.COORDINATOR)
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddShipmentItemDto,
  ) {
    return this.service.addItem(id, dto);
  }
}
