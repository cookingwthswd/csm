/* eslint-disable prettier/prettier */
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, CheckStoreAccessGuard } from '../auth';
import type { AuthUser } from '../auth';
import { PaginationDto } from '../common';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { UserRoleEnum } from '../users/dto/user.dto';

/**
 * Orders Controller - HTTP Layer
 *
 * NGUYÊN TẮC:
 * - Controller CHỈ handle HTTP concerns:
 *   - Parse request (body, params, query)
 *   - Validate input (via DTOs + ValidationPipe)
 *   - Call service
 *   - Return response
 * - KHÔNG chứa business logic (delegate to service)
 *
 * SWAGGER DECORATORS:
 * - @ApiTags: Group endpoints trong Swagger UI
 * - @ApiBearerAuth: Hiển thị lock icon, yêu cầu JWT
 * - @ApiOperation: Mô tả endpoint
 * - @ApiResponse: Document response format
 * - @ApiParam: Document path parameters
 *
 * AUTH DECORATORS:
 * - @Roles: Chỉ roles này mới access được
 * - @CurrentUser: Inject user từ JWT
 */
@ApiTags('orders') // Swagger: group dưới "orders"
@ApiBearerAuth() // Swagger: show "Authorize" button
@Controller('orders') // Route prefix: /orders
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  /**
   * GET /orders/store/:id
   * Lấy danh sách orders của 1 store với pagination
   *
   * VÍ DỤ:
   * GET /orders/store/:id?page=1&limit=20
   *
   * RESPONSE:
   * {
   *   "success": true,
   *   "data": {
   *     "data": [...orders],
   *     "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
   *   }
   * }
   */
  @Get('/store/:storeId')
  @ApiOperation({ summary: 'List all orders of a store' })
  @ApiParam({ name: 'storeId', type: Number, description: 'store ID' })
  @ApiResponse({
    status: 200,
    description: 'List of orders of a store with pagination',
  })
  @Roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.CK_STAFF,
    UserRoleEnum.STORE_STAFF,
    UserRoleEnum.MANAGER,
    UserRoleEnum.COORDINATOR,
  )
  @UseGuards(CheckStoreAccessGuard)
  findAllOfStore(
    @Param('storeId', ParseIntPipe) storeId: number, // ParseIntPipe validate & convert
    @Query() pagination: PaginationDto, // Auto-validate & transform
  ) {
    return this.ordersService.findAll(pagination, storeId);
  }

  /**
   * GET /orders
   * Lấy danh sách orders với pagination
   *
   * VÍ DỤ:
   * GET /orders?page=1&limit=20
   *
   * RESPONSE:
   * {
   *   "success": true,
   *   "data": {
   *     "data": [...orders],
   *     "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
   *   }
   * }
   */
  @Get('')
  @ApiOperation({ summary: 'List all orders with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of orders with pagination',
  })
  @Roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.CK_STAFF,
    UserRoleEnum.MANAGER,
    UserRoleEnum.COORDINATOR,
  )
  findAll(
    @Query() pagination: PaginationDto, // Auto-validate & transform
  ) {
    return this.ordersService.findAll(pagination);
  }

  /**
   * GET /orders/:id
   * Lấy chi tiết 1 order
   *
   * ParseIntPipe: Convert string "1" → number 1
   * Nếu không phải number → throw BadRequestException
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.CK_STAFF,
    UserRoleEnum.MANAGER,
    UserRoleEnum.COORDINATOR,
    UserRoleEnum.STORE_STAFF
  )
  findOne(
    @Param('id', ParseIntPipe) id: number, // ParseIntPipe validate & convert
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findOne(id, user.storeId, user.role as UserRoleEnum);
  }

  /**
   * POST /orders
   * Tạo order mới
   *
   * @Body() CreateOrderDto: Auto-validate input
   * Nếu invalid → throw BadRequestException với chi tiết lỗi
   */
  @Post('')
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.CK_STAFF,
    UserRoleEnum.MANAGER,
    UserRoleEnum.COORDINATOR,
    UserRoleEnum.STORE_STAFF
  )
  @UseGuards(CheckStoreAccessGuard)
  create(
    @Body() dto: CreateOrderDto, // Auto-validate
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.create(dto, user);
  }

  /**
   * PUT /orders/:id/status
   * Update order status
   *
   * Tách riêng endpoint cho status update vì:
   * - Logic khác với update thông thường
   * - Có thể thêm workflow validation sau này
   * - Dễ phân quyền (ai được update status)
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.COORDINATOR) // store_staff không được update status
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  /**
 * PUT /orders/:id
 * Update pending orders
 */
  @Put('/:id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.STORE_STAFF
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    console.log(dto)
    return this.ordersService.update(id, dto, user);
  }
}


