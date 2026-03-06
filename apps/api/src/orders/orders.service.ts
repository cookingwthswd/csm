/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  SupabaseClient,
  PostgrestError,
} from '@supabase/supabase-js';
import { ORDER_STATUS_VALUES, type Database } from '@repo/types';
import { PaginationDto } from '../common';
import {
  CreateOrderDto,
  ORDER_STATUSES,
  UpdateOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { UserRoleEnum } from 'src/users/dto/user.dto';
import { AuthUser } from 'src/auth';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Orders Service - Business Logic Layer
 *
 * NGUYÊN TẮC:
 * - Controller chỉ handle HTTP (validate, route, response)
 * - Service chứa business logic (query DB, transform data)
 * - Service KHÔNG throw raw DB errors (wrap vào HttpException)
 *
 * SUPABASE CLIENT:
 * - Dùng SERVICE_ROLE_KEY để bypass RLS (Row Level Security)
 * - Backend đã validate user qua JWT, nên có full access
 * - Nhưng vẫn filter theo chain_id để đảm bảo data isolation
 */
@Injectable()
export class OrdersService {
  private supabase: SupabaseClient<Database>;

  constructor(
    private configService: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    // Khởi tạo Supabase client với service role key
    // Service role key có full access, bypass RLS
    this.supabase = createClient<Database>(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Handle Supabase errors - wrap vào HttpException để:
   * 1. Không leak internal DB errors ra client
   * 2. Format lỗi nhất quán qua HttpExceptionFilter
   */
  private handleError(error: PostgrestError, context: string): never {
    // Log full error for debugging (server-side only)
    console.error(`[OrdersService] ${context}:`, error);

    // Return generic error to client
    throw new InternalServerErrorException(`Database error: ${context}`);
  }

  /**
   * Lấy danh sách orders với pagination
   *
   * @param storeId - Store ID từ user context (data isolation)
   * @param pagination - { page, limit }
   * @returns { data: Order[], meta: { total, page, limit, totalPages } }
   */
  async findAll(pagination: PaginationDto, storeId?: number) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('orders')
      .select(
        `
    *,
        order_items (
          id,
          item_id,
          quantity_ordered,
          unit_price,
          order_id,
          notes,
          items ( name, type )
        ),
        stores ( name ),
        users:users!created_by ( full_name, role )
  `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (storeId !== undefined) {
      query = query.eq('store_id', storeId);
    }
    // Query với count để biết tổng số records
    const { data, error, count } = await query;

    if (error) this.handleError(error, 'Failed to fetch orders');

    return {
      data: this.transformOrders(data as OrderWithRelations[]),
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Lấy chi tiết 1 order
   */
  async findOne(id: number, storeId: number | null, userRole: UserRoleEnum) {
    let query = this.supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          item_id,
          quantity_ordered,
          unit_price,
          order_id,
          notes,
          items ( name, type )
        ),
        stores ( name ),
        users:users!created_by ( full_name, role )
      `,
      )
      .eq('id', id);

    // 🔐 Staff can only access their own store
    if (userRole === UserRoleEnum.STORE_STAFF) {
      if (!storeId) {
        throw new ForbiddenException('Store access required');
      }
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    console.log(data);

    return this.transformOrder(data as OrderWithRelations);
  }

  /**
   * Tạo order mới
   *
   * FLOW:
   * 1. Generate order code
   * 2. Insert order record
   * 3. Insert order items
   * 4. Return complete order
   */
  async create(dto: CreateOrderDto, user: AuthUser) {
    console.log(dto);
    const orderCode = `ORD-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

    if (
      (user.role as UserRoleEnum) === UserRoleEnum.STORE_STAFF &&
      !user.storeId
    ) {
      throw new InternalServerErrorException(
        'Failed to create order. No Store ID found',
      );
    }

    // 1️⃣ Create order (temporary total_amount = 0)
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        store_id: dto.storeId,
        order_code: orderCode,
        status: 'pending',
        notes: dto.notes,
        created_by: user.id,
        total_amount: 0,
      })
      .select()
      .single();

    if (orderError) this.handleError(orderError, 'Failed to create order');
    if (!order)
      throw new InternalServerErrorException('Failed to create order');

    // 2️⃣ Fetch current prices
    const itemIds = dto.items.map((i) => i.itemId);

    const { data: dbItems, error: itemsFetchError } = await this.supabase
      .from('items')
      .select('id, current_price')
      .in('id', itemIds);

    if (itemsFetchError || !dbItems) {
      this.handleError(itemsFetchError, 'Failed to fetch item prices');
    }

    const priceMap = new Map(
      dbItems.map((item) => [item.id, item.current_price]),
    );

    // 3️⃣ Build order items + calculate total
    let totalAmount = 0;

    const orderItems = dto.items.map((item) => {
      const unitPrice = priceMap.get(item.itemId);

      if (unitPrice == null) {
        throw new InternalServerErrorException(
          `Price not found for item ${item.itemId}`,
        );
      }

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      return {
        order_id: order.id,
        item_id: item.itemId,
        notes: item.notes,
        quantity_ordered: item.quantity,
        unit_price: unitPrice,
      };
    });

    // 4️⃣ Insert order items
    const { error: itemsError } = await this.supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError)
      this.handleError(itemsError, 'Failed to create order items');

    // 5️⃣ Update order total
    const { error: totalUpdateError } = await this.supabase
      .from('orders')
      .update({ total_amount: totalAmount })
      .eq('id', order.id);

    if (totalUpdateError)
      this.handleError(totalUpdateError, 'Failed to update order total');

    // 6️⃣ Return full order
    const result = await this.findOne(order.id, user.storeId, user.role as UserRoleEnum);

    // 7️⃣ Notify: order created
    this.notifications.notifyOrderCreated(user.id, order.id, `Store #${dto.storeId}`).catch(() => {});

    return result;
  }

  /**
   * Update order
   *
   * FLOW:
   * 1. Fetch order & validate status
   * 2. Only pending orders can be edited
   */
  async update(id: number, dto: UpdateOrderDto, user: AuthUser) {
    console.log(dto);
    const { data: existingOrder, error: fetchError } = await this.supabase
      .from('orders')
      .select('id, status, store_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingOrder) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    if (existingOrder.status !== 'pending') {
      throw new ForbiddenException('Only pending orders can be edited');
    }

    if (
      (user.role as UserRoleEnum) === UserRoleEnum.STORE_STAFF &&
      user.storeId !== existingOrder.store_id
    ) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // 1️⃣ Update order basic info
    const { error: orderUpdateError } = await this.supabase
      .from('orders')
      .update({
        store_id: dto.storeId ?? existingOrder.store_id,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (orderUpdateError) {
      this.handleError(orderUpdateError, 'Failed to update order');
    }

    // 2️⃣ Fetch current prices
    const itemIds = dto.items.map((i) => i.itemId);

    const { data: dbItems, error: itemsFetchError } = await this.supabase
      .from('items')
      .select('id, current_price')
      .in('id', itemIds);

    if (itemsFetchError || !dbItems) {
      this.handleError(itemsFetchError, 'Failed to fetch item prices');
    }

    const priceMap = new Map(
      dbItems.map((item) => [item.id, item.current_price]),
    );

    // 3️⃣ Rebuild order items + total
    let totalAmount = 0;

    const orderItems = dto.items.map((item) => {
      const unitPrice = priceMap.get(item.itemId);

      if (unitPrice == null) {
        throw new InternalServerErrorException(
          `Price not found for item ${item.itemId}`,
        );
      }

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      return {
        order_id: id,
        item_id: item.itemId,
        notes: item.notes,
        quantity_ordered: item.quantity,
        unit_price: unitPrice,
      };
    });

    // 4️⃣ Delete old items
    const { error: deleteError } = await this.supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (deleteError) {
      this.handleError(deleteError, 'Failed to remove old order items');
    }

    // 5️⃣ Insert new items
    const { error: insertError } = await this.supabase
      .from('order_items')
      .insert(orderItems);

    if (insertError) {
      this.handleError(insertError, 'Failed to insert updated order items');
    }

    // 6️⃣ Update total amount
    const { error: totalUpdateError } = await this.supabase
      .from('orders')
      .update({ total_amount: totalAmount })
      .eq('id', id);

    if (totalUpdateError) {
      this.handleError(totalUpdateError, 'Failed to update order total');
    }

    // 7️⃣ Return updated order
    return this.findOne(id, user.storeId, user.role as UserRoleEnum);
  }

  /**
   * Update order status
   *
   * VÍ DỤ STATUS FLOW:
   * draft → submitted → confirmed → in_production → ready → in_delivery → delivered
   *                                                                    ↘ cancelled
   */
  async updateStatus(id: number, dto: UpdateOrderStatusDto, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status: dto.status,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Notify: order status changed
    const createdBy = data.created_by;
    if (createdBy && createdBy !== user.id) {
      this.notifications.notifyOrderStatusChanged(createdBy, id, dto.status).catch(() => {});
    }

    return this.findOne(id, null, user.role as UserRoleEnum);
  }

  async getOrderItemsWithRemaining(orderId: number) {
    const { data, error } = await this.supabase
      .from('order_items')
      .select(`
        id,
        quantity_ordered,
        item:item_id(name),
        shipment_items(
          quantity_shipped,
          shipments(status)
        )
      `)
      .eq('order_id', orderId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) return [];

    return data.map((item) => {
      const totalShipped =
        item.shipment_items
          ?.filter((s: any) => s.shipments?.status !== 'cancelled')
          .reduce(
            (sum: number, s: any) => sum + s.quantity_shipped,
            0
          ) ?? 0;

      return {
        ...item,
        shipped_quantity: totalShipped,
        remaining_quantity:
          item.quantity_ordered - totalShipped,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS - Transform data từ DB format sang API format
  // ═══════════════════════════════════════════════════════════

  /**
   * Transform array of orders
   * DB trả về snake_case, API return camelCase
   */
  private transformOrders(orders: OrderWithRelations[]) {
    return orders.map((order) => this.transformOrder(order));
  }

  /**
   * Transform single order
   *
   * INPUT (from DB):
   * { id: 1, store_id: 1, order_code: 'ORD-001', ... }
   *
   * OUTPUT (to API):
   * { id: 1, storeId: 1, orderCode: 'ORD-001', ... }
   */
  private transformOrder(order: OrderWithRelations) {
    return {
      id: order.id,
      storeId: order.store_id,
      storeName: order.stores?.name,
      orderCode: order.order_code,
      status: order.status,
      deliveryDate: order.delivery_date,
      totalAmount: order.total_amount,
      notes: order.notes,
      items: (order.order_items || []).map((item) => ({
        id: item.id,
        itemId: item.item_id,
        itemName: item.items?.name,
        quantity: item.quantity_ordered,
        unitPrice: item.unit_price,
        type: item.items?.type,
        notes: item.notes,
      })),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      createdBy: order.users.full_name || '',
      creatorRole: order.users.role,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS - DB Row Types with Relations
// ═══════════════════════════════════════════════════════════

/**
 * Type cho order item row từ Supabase với relations
 */
type OrderItemWithRelations =
  Database['public']['Tables']['order_items']['Row'] & {
    items?: { name: string; type: string };
  };

/**
 * Type cho order row từ Supabase với relations
 */
type OrderWithRelations = Database['public']['Tables']['orders']['Row'] & {
  order_items?: OrderItemWithRelations[];
  stores?: { name: string };
  users: { full_name: string; role: string };
};
