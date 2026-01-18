import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

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
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Khởi tạo Supabase client với service role key
    // Service role key có full access, bypass RLS
    this.supabase = createClient(
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
   * @param chainId - Chain ID từ JWT (data isolation)
   * @param pagination - { page, limit }
   * @returns { data: Order[], meta: { total, page, limit, totalPages } }
   */
  async findAll(chainId: number, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Query với count để biết tổng số records
    const { data, error, count } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          products ( name )
        ),
        stores ( name )
      `,
        { count: 'exact' }, // Trả về total count
      )
      .eq('chain_id', chainId) // Filter theo chain (data isolation)
      .order('created_at', { ascending: false }) // Mới nhất trước
      .range(offset, offset + limit - 1); // Pagination

    if (error) this.handleError(error, 'Failed to fetch orders');

    return {
      data: this.transformOrders(data || []),
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
  async findOne(id: number, chainId: number) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          products ( name )
        ),
        stores ( name )
      `,
      )
      .eq('id', id)
      .eq('chain_id', chainId) // Đảm bảo user chỉ xem được order của chain mình
      .single();

    if (error || !data) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return this.transformOrder(data);
  }

  /**
   * Tạo order mới
   *
   * FLOW:
   * 1. Generate order number
   * 2. Insert order record
   * 3. Insert order items
   * 4. Return complete order
   */
  async create(dto: CreateOrderDto, user: { id: string; chainId: number }) {
    // Generate unique order number: ORD-YYYYMMDD-XXXXX
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;

    // Insert order
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        chain_id: user.chainId,
        store_id: dto.storeId,
        order_number: orderNumber,
        status: 'draft',
        requested_date: dto.requestedDate,
        notes: dto.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (orderError) this.handleError(orderError, 'Failed to create order');

    // Insert order items
    const items = dto.items.map((item) => ({
      chain_id: user.chainId,
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await this.supabase.from('order_items').insert(items);

    if (itemsError) this.handleError(itemsError, 'Failed to create order items');

    // Return complete order with items
    return this.findOne(order.id, user.chainId);
  }

  /**
   * Update order status
   *
   * VÍ DỤ STATUS FLOW:
   * draft → submitted → confirmed → in_production → ready → in_delivery → delivered
   *                                                                    ↘ cancelled
   */
  async updateStatus(id: number, dto: UpdateOrderStatusDto, chainId: number) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status: dto.status,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('chain_id', chainId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return this.findOne(id, chainId);
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS - Transform data từ DB format sang API format
  // ═══════════════════════════════════════════════════════════

  /**
   * Transform array of orders
   * DB trả về snake_case, API return camelCase
   */
  private transformOrders(orders: OrderRow[]) {
    return orders.map((order) => this.transformOrder(order));
  }

  /**
   * Transform single order
   *
   * INPUT (from DB):
   * { id: 1, chain_id: 1, store_id: 1, order_number: 'ORD-001', ... }
   *
   * OUTPUT (to API):
   * { id: 1, chainId: 1, storeId: 1, orderNumber: 'ORD-001', ... }
   */
  private transformOrder(order: OrderRow) {
    return {
      id: order.id,
      chainId: order.chain_id,
      storeId: order.store_id,
      storeName: order.stores?.name,
      orderNumber: order.order_number,
      status: order.status,
      requestedDate: order.requested_date,
      totalAmount: order.total_amount,
      notes: order.notes,
      items: (order.order_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS - DB Row Types
// ═══════════════════════════════════════════════════════════

/**
 * Type cho order row từ Supabase
 * snake_case matching DB column names
 *
 * TIP cho BE team:
 * - Có thể generate types tự động từ DB: npx supabase gen types typescript
 * - Hoặc define manual như này cho flexibility
 */
interface OrderItemRow {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number | null;
  products?: { name: string };
}

interface OrderRow {
  id: number;
  chain_id: number;
  store_id: number;
  order_number: string;
  status: string;
  requested_date: string;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
  stores?: { name: string };
}
