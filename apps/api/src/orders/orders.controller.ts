import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/supabase.strategy';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

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
  constructor(private readonly ordersService: OrdersService) {}

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
  @Get()
  @ApiOperation({ summary: 'List orders for current chain' })
  @ApiResponse({ status: 200, description: 'List of orders with pagination' })
  @Roles('admin', 'manager', 'supply_coordinator', 'store_staff')
  findAll(
    @CurrentUser() user: AuthUser, // Inject từ JWT
    @Query() pagination: PaginationDto, // Auto-validate & transform
  ) {
    return this.ordersService.findAll(user.chainId, pagination);
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
  @Roles('admin', 'manager', 'supply_coordinator', 'store_staff')
  findOne(
    @Param('id', ParseIntPipe) id: number, // ParseIntPipe validate & convert
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findOne(id, user.chainId);
  }

  /**
   * POST /orders
   * Tạo order mới
   *
   * @Body() CreateOrderDto: Auto-validate input
   * Nếu invalid → throw BadRequestException với chi tiết lỗi
   */
  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles('store_staff', 'manager') // Chỉ store_staff và manager mới tạo được
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
  @Roles('admin', 'manager', 'supply_coordinator') // store_staff không được update status
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user.chainId);
  }
}
