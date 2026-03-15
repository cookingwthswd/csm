/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';
import {
  AddShipmentItemDto,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/shipment.dto';
import { UpdateShipmentDto } from '@repo/types';
import { UserRoleEnum } from '../users/dto/user.dto';
import { AuthUser } from '../auth';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ShipmentsService {
  private supabase: SupabaseClient<Database>;

  constructor(
    config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  private async updateOrderFulfillmentStatus(orderId: number) {
    const { data: items } = await this.supabase
      .from('order_items')
      .select('id, quantity_ordered')
      .eq('order_id', orderId);

    let fullyFulfilled = true;
    let partially = false;

    for (const item of items ?? []) {
      const { data: shipped } = await this.supabase
        .from('shipment_items')
        .select(
          `
        quantity_shipped,
        shipments!inner(status)
      `,
        )
        .eq('order_item_id', item.id)
        .neq('shipments.status', 'cancelled');

      const total =
        shipped?.reduce((sum, r) => sum + r.quantity_shipped, 0) ?? 0;

      if (total < item.quantity_ordered) fullyFulfilled = false;
      if (total > 0) partially = true;
    }

    // Map fulfillment state to valid order statuses
    // orders.status check constraint allows:
    // 'pending', 'approved', 'processing', 'shipping', 'delivered', 'cancelled'
    let status:
      | 'pending'
      | 'approved'
      | 'processing'
      | 'shipping'
      | 'delivered'
      | 'cancelled' = 'processing';

    if (fullyFulfilled) {
      status = 'delivered';
    } else if (partially) {
      status = 'shipping';
    }

    await this.supabase.from('orders').update({ status }).eq('id', orderId);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*, orders(order_code, store_id, stores(name))')
      .neq('status', 'cancelled')
      .order('id', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('shipments')
      .select(
        `
        *,
        orders (
          order_code,
          store_id,
          stores ( name, address )
        ),
        shipment_items (
          id,
          quantity_shipped,
          note,
          batches ( batch_code, expiry_date ),
          order_items ( items ( name ) )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Shipment #${id} not found`);
    }

    if (
      user.role === UserRoleEnum.STORE_STAFF &&
      user.storeId !== data.orders.store_id
    ) {
      throw new ForbiddenException(
        `You are not allowed to access Shipment #${id}`,
      );
    }

    return data;
  }

  async create(dto: CreateShipmentDto, user: AuthUser) {
    if (
      ![UserRoleEnum.ADMIN, UserRoleEnum.COORDINATOR].includes(
        user.role as UserRoleEnum,
      )
    ) {
      throw new ForbiddenException('Bạn không có quyền tạo vận đơn');
    }

    const { data: order } = await this.supabase
      .from('orders')
      .select('id, status, store_id')
      .eq('id', dto.order_id)
      .single();

    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');
    if (order.status !== 'processed') {
      throw new BadRequestException('Chỉ có đơn hàng ở trạng thái processed mới có thể tạo vận đơn');
    }

    const { data: lastShipment } = await this.supabase
      .from('shipments')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = lastShipment ? lastShipment.id + 1 : 1;

    const shipmentCode = `SHP-${nextNumber.toString().padStart(6, '0')}`;

    const { data: shipment, error } = await this.supabase
      .from('shipments')
      .insert({
        shipment_code: shipmentCode,
        order_id: dto.order_id,
        driver_name: dto.driver_name,
        driver_phone: dto.driver_phone,
        notes: dto.notes,
      })
      .select()
      .single();

    if (error || !shipment) {
      throw new InternalServerErrorException('Lỗi khi tạo vận đơn: ' + error.message);
    }

    this.notifications.notifyDeliveryUpdate(user.id, shipment.id, 'Dang chuan bi').catch(() => {});

    return shipment;
  }

  async getItems(shipmentId: number) {
    const { data, error } = await this.supabase
      .from('shipment_items')
      .select(
        `
        *,
        batches ( batch_code, expiry_date ),
        order_items ( items ( name ) )
      `,
      )
      .eq('shipment_id', shipmentId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async addItem(shipmentId: number, dto: AddShipmentItemDto) {
    const { data: shipment } = await this.supabase
      .from('shipments')
      .select('id, status, order_id')
      .eq('id', shipmentId)
      .single();

    if (!shipment) throw new NotFoundException('Không tìm thấy vận đơn');

    if (shipment.status !== 'preparing') {
      throw new BadRequestException('Chỉ được thêm sản phẩm khi shipment ở trạng thái preparing');
    }

    const { data: orderItem } = await this.supabase
      .from('order_items')
      .select('id, quantity_ordered')
      .eq('id', dto.order_item_id)
      .eq('order_id', shipment.order_id)
      .single();

    if (!orderItem) {
      throw new BadRequestException('Vật phẩm không tồn tại trong đơn hàng!');
    }

    const { data: shippedRows } = await this.supabase
      .from('shipment_items')
      .select(
        `
        quantity_shipped,
        shipments!inner(status)
      `,
      )
      .eq('order_item_id', dto.order_item_id)
      .neq('shipments.status', 'cancelled');

    const totalShipped =
      shippedRows?.reduce((sum, r) => sum + r.quantity_shipped, 0) ?? 0;

    if (totalShipped + dto.quantity_shipped > orderItem.quantity_ordered) {
      throw new BadRequestException('Vượt quá số lượng còn lại của đơn hàng');
    }

    const { data: batch } = await this.supabase
      .from('batches')
      .select('current_quantity')
      .eq('id', dto.batch_id)
      .single();

    if (!batch || batch.current_quantity < dto.quantity_shipped) {
      throw new BadRequestException('Không đủ hàng tồn kho trong lô sản phẩm');
    }

    const { error } = await this.supabase.from('shipment_items').insert({
      shipment_id: shipmentId,
      order_item_id: dto.order_item_id,
      batch_id: dto.batch_id,
      quantity_shipped: dto.quantity_shipped,
      note: dto.note,
    });

    if (error) throw new InternalServerErrorException(error.message);

    return { success: true };
  }

  async updateStatus(
    id: number,
    newStatus: 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled',
  ) {
    const { data: shipment } = await this.supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (!shipment) {
      throw new BadRequestException('Không tìm thấy vận đơn');
    }

    const currentStatus = shipment.status;

    const allowedTransitions: Record<string, string[]> = {
      pending: ['preparing', 'cancelled'],
      preparing: ['shipping', 'cancelled'],
      shipping: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ ${currentStatus} sang ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };

    if (newStatus === 'shipping') {
      updateData.shipped_date = new Date().toISOString();
    }

    if (newStatus === 'delivered') {
      updateData.delivered_date = new Date().toISOString();
      await this.processDelivered(id);
    }


    if (newStatus === 'cancelled') {
      updateData.shipped_date = null;
      updateData.delivered_date = null;
    }

    const { data, error } = await this.supabase
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // Notify: shipment status changed
    const statusLabels: Record<string, string> = {
      preparing: 'PREPARING',
      shipping: 'SHIPPING',
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
    };
    // Notify the order creator about delivery update
    if (shipment.order_id) {
      const { data: orderData } = await this.supabase
        .from('orders')
        .select('created_by')
        .eq('id', shipment.order_id)
        .single();

      if (orderData?.created_by) {
        this.notifications.notifyDeliveryUpdate(
          orderData.created_by,
          id,
          statusLabels[newStatus] ?? newStatus,
        ).catch(() => {});
      }
    }

    return data;
  }

  async update(id: number, dto: UpdateShipmentDto & { status?: string }) {
    const { data: existing, error: fetchError } = await this.supabase
      .from('shipments')
      .select('status, order_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing)
      throw new NotFoundException('Vận đơn không tồn tại');

    if (['delivered', 'cancelled'].includes(existing.status)) {
      throw new BadRequestException('Không thể chỉnh sửa vận đơn đã kết thúc');
    }

    const updateData: any = {
      driver_name: dto.driver_name,
      driver_phone: dto.driver_phone,
      notes: dto.notes,
      updated_at: new Date().toISOString(),
    };

    if (dto.status && dto.status !== existing.status) {
      const allowed: Record<string, string[]> = {
        preparing: ['pending', 'cancelled'],
        pending: ['shipping', 'cancelled'],
        shipping: ['delivered', 'cancelled'],
      };

      if (!allowed[existing.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Lỗi: Không thể chuyển từ ${existing.status} sang ${dto.status}`,
        );
      }

      updateData.status = dto.status;
      if (dto.status === 'shipping')
        updateData.shipped_date = new Date().toISOString();
      if (dto.status === 'completed')
        updateData.delivered_date = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    await this.updateOrderFulfillmentStatus(existing.order_id);

    return data;
  }

  // async remove(id: number) {
  //   const { data: existing, error: fetchError } = await this.supabase
  //     .from('shipments')
  //     .select('id, status')
  //     .eq('id', id)
  //     .maybeSingle();

  //   if (fetchError) throw new InternalServerErrorException(fetchError.message);
  //   if (!existing) {
  //     throw new NotFoundException(`Shipment #${id} không tồn tại để xóa`);
  //   }

  //   if (existing.status !== 'preparing') {
  //     throw new BadRequestException(
  //       `Không thể xóa vận đơn đang ở trạng thái "${existing.status}". Chỉ vận đơn ở trạng thái "preparing" mới được phép xóa.`,
  //     );
  //   }

  //   const { error: updateError } = await this.supabase
  //     .from('shipments')
  //     .update({ status: 'cancelled' })
  //     .eq('id', id);

  //   if (updateError)
  //     throw new InternalServerErrorException(updateError.message);

  //   return { success: true, message: `Đã hủy thành công vận đơn #${id}` };
  // }

  async traceBatch(batchId: number) {
    const { data, error } = await this.supabase
      .from('shipment_items')
      .select(
        `
        quantity_shipped,
        shipments (
          shipment_code,
          status,
          orders ( order_code, store_id )
        )
      `,
      )
      .eq('batch_id', batchId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async traceShipment(id: number) {
    const { data, error } = await this.supabase
      .from('shipment_items')
      .select(
        `
        quantity_shipped,
        batches ( batch_code, expiry_date )
      `,
      )
      .eq('shipment_id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateItem(
    shipmentId: number,
    itemId: number,
    dto: AddShipmentItemDto,
  ) {
    const { data: shipmentItem, error: itemError } = await this.supabase
      .from('shipment_items')
      .select('id, shipment_id, order_item_id')
      .eq('id', itemId)
      .eq('shipment_id', shipmentId)
      .single();

    if (itemError || !shipmentItem) {
      throw new BadRequestException('Không tìm thấy sản phẩm trong vận đơn');
    }

    const { data: shipment } = await this.supabase
      .from('shipments')
      .select('status')
      .eq('id', shipmentId)
      .single();

    if (!shipment) {
      throw new BadRequestException('Không tìm thấy vận đơn');
    }

    if (shipment.status !== 'pending') {
      throw new BadRequestException(
        'Chỉ được chỉnh sửa sản phẩm khi shipment ở trạng thái pending',
      );
    }

    if (dto.quantity_shipped <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    const { data: orderItem } = await this.supabase
      .from('order_items')
      .select('quantity_ordered')
      .eq('id', shipmentItem.order_item_id)
      .single();

    if (!orderItem) {
      throw new BadRequestException('Không tìm thấy sản phẩm trong đơn hàng');
    }

    const { data: shippedItems } = await this.supabase
      .from('shipment_items')
      .select(
        `
        quantity_shipped,
        shipments!inner(status)
      `,
      )
      .eq('order_item_id', shipmentItem.order_item_id)
      .neq('id', itemId)
      .neq('shipments.status', 'cancelled');

    const totalShipped =
      shippedItems?.reduce((sum, i) => sum + i.quantity_shipped, 0) ?? 0;

    if (totalShipped + dto.quantity_shipped > orderItem.quantity_ordered) {
      throw new BadRequestException('Vượt quá số lượng còn lại của đơn hàng');
    }

    const { error } = await this.supabase
      .from('shipment_items')
      .update({
        quantity_shipped: dto.quantity_shipped,
        note: dto.note,
      })
      .eq('id', itemId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { success: true };
  }

  async getBatchesByItem(itemId: number) {
    const { data, error } = await this.supabase
      .from('batches')
      .select('id, batch_code, current_quantity, expiry_date')
      .eq('item_id', itemId)
      .gt('current_quantity', 0)
      .eq('status', 'active') 
      .order('expiry_date', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async processDelivered(shipmentId: number) {
    const { data: shipment, error: shipmentError } = await this.supabase
      .from('shipments')
      .select(`
        id,
        order_id,
        orders(store_id)
      `)
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      throw new NotFoundException("Shipment not found");
    }

    const storeId = shipment.orders?.store_id;

    if (!storeId) {
      throw new BadRequestException("Shipment is missing store information");
    }

    const { data: items, error: itemsError } = await this.supabase
      .from('shipment_items')
      .select(`
        id,
        quantity_shipped,
        batch_id,
        order_items(
          item_id
        )
      `)
      .eq('shipment_id', shipmentId);

    if (itemsError) {
      throw new BadRequestException("Failed to load shipment items");
    }

    if (!items || items.length === 0) {
      return;
    }

    for (const item of items) {

      const itemId = item.order_items?.item_id;

      if (!itemId || !item.batch_id) continue;

      const { data: batch, error: batchError } = await this.supabase
        .from("batches")
        .select("id, current_quantity")
        .eq("id", item.batch_id)
        .single();

      if (batchError || !batch) {
        throw new NotFoundException(`Batch ${item.batch_id} not found`);
      }

      const nextQuantity = batch.current_quantity - item.quantity_shipped;

      await this.supabase
        .from("batches")
        .update({
          current_quantity: nextQuantity
        })
        .eq("id", item.batch_id);

      const { data: inv } = await this.supabase
        .from("inventory")
        .select("id, quantity")
        .eq("store_id", storeId)
        .eq("item_id", itemId)
        .maybeSingle();

      if (inv) {

        await this.supabase
          .from("inventory")
          .update({
            quantity: inv.quantity + item.quantity_shipped,
            last_updated: new Date().toISOString()
          })
          .eq("id", inv.id);

      } else {

        await this.supabase
          .from("inventory")
          .insert({
            store_id: storeId,
            item_id: itemId,
            quantity: item.quantity_shipped,
            last_updated: new Date().toISOString()
          });

      }

      const { error: txError } = await this.supabase
        .from("inventory_transactions")
        .insert({
          store_id: storeId,
          item_id: itemId,
          batch_id: item.batch_id,
          quantity_change: item.quantity_shipped,
          transaction_type: "import",
          reference_type: "shipment",
          reference_id: shipmentId,
          note: "Shipment delivered",
          created_at: new Date().toISOString()
        });

      if (txError) {
        console.error("Insert transaction error:", txError);
        throw new BadRequestException(txError.message);
      }
    }
  }
}