/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import type { Database, UpdateShipmentDto } from '@repo/types';
import { CreateShipmentDto, UpdateShipmentStatusDto } from './dto/shipment.dto';
import { UserRoleEnum } from '../users/dto/user.dto';
import { AuthUser } from '../auth';

@Injectable()
export class ShipmentsService {
  private supabase: SupabaseClient<Database>;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('*, orders(order_code, store_id)')
      .neq('status', 'cancelled') // Lọc ra: chỉ lấy những thằng KHÔNG PHẢI là cancelled/deleted
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

    const { data: existingShipment } = await this.supabase
    .from('shipments')
    .select('id')
    .eq('order_id', dto.orderId)
    .neq('status', 'cancelled')
    .maybeSingle();

    if (existingShipment) {
      throw new BadRequestException(
        `Đơn hàng #${dto.orderId} đã được tạo vận đơn trước đó.`,
      );
    }

    const { data: order } = await this.supabase
      .from('orders')
      .select('id, status, store_id')
      .eq('id', dto.orderId)
      .single();

    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'processing') {
      throw new BadRequestException('Only processing orders can be shipped');
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
        order_id: dto.orderId,
        driver_name: dto.driverName,
        driver_phone: dto.driverPhone,
        notes: dto.notes,
      })
      .select()
      .single();

    if (error || !shipment) {
      throw new InternalServerErrorException('Failed to create shipment');
    }

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

  async addItem(shipmentId: number, dto: any) {
    const { data: batch } = await this.supabase
      .from('batches')
      .select('current_quantity, item_id')
      .eq('id', dto.batchId)
      .single();

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.current_quantity < dto.quantityShipped) {
      throw new BadRequestException('Insufficient batch stock');
    }

    const { error } = await this.supabase.from('shipment_items').insert({
      shipment_id: shipmentId,
      order_item_id: dto.orderItemId,
      batch_id: dto.batchId,
      quantity_shipped: dto.quantityShipped,
      note: dto.note,
    });

    if (error) throw new InternalServerErrorException(error.message);

    const { data, error: shipmentError } = await this.supabase
      .from('shipments')
      .select('orders(store_id)')
      .eq('id', shipmentId)
      .single();

    if (!data?.orders?.store_id) {
      throw new BadRequestException('Invalid shipment or order');
    }

    const storeId = data.orders.store_id;

    await this.supabase.from('inventory_transactions').insert({
      store_id: storeId,
      item_id: batch.item_id,
      batch_id: dto.batchId,
      quantity_change: -dto.quantityShipped,
      transaction_type: 'export',
      reference_type: 'shipment',
      reference_id: shipmentId,
    });

    return { success: true };
  }

  async updateStatus(id: number, dto: UpdateShipmentStatusDto, user: AuthUser) {
    const { data: shipment } = await this.supabase
      .from('shipments')
      .select('id, status, order_id')
      .eq('id', id)
      .single();

    if (!shipment) throw new NotFoundException('Shipment not found');

    if (shipment.status === 'delivered') {
      throw new BadRequestException('Shipment already delivered');
    }

    const updateData: any = {
      status: dto.status,
      updated_at: new Date().toISOString(),
    };

    if (dto.status === 'shipping') {
      updateData.shipped_date = new Date().toISOString();
    }

    if (dto.status === 'delivered') {
      updateData.delivered_date = new Date().toISOString();

      await this.supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', shipment.order_id);
    }

    await this.supabase.from('shipments').update(updateData).eq('id', id);

    return { success: true };
  }

  async update(id: number, dto: UpdateShipmentDto) {
  const { data: existing } = await this.supabase
    .from('shipments')
    .select('status')
    .eq('id', id)
    .single();

  if (!existing) throw new NotFoundException('Không tìm thấy vận đơn');

  if (existing?.status === 'cancelled' || existing?.status === 'delivered') {
    throw new BadRequestException('Không thể chỉnh sửa thông tin vận đơn đã hủy hoặc đã hoàn thành');
  }

  const { error } = await this.supabase
    .from('shipments')
    .update({
      driver_name: dto.driverName,
      driver_phone: dto.driverPhone,
      notes: dto.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new InternalServerErrorException('Lỗi chỉnh sửa thông tin');
  return { success: true };
}

  async remove(id: number) {
    const { data: existing, error: fetchError } = await this.supabase
      .from('shipments')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw new InternalServerErrorException(fetchError.message);
    if (!existing) {
      throw new NotFoundException(`Shipment #${id} không tồn tại để xóa`);
    }

    if (existing.status !== 'preparing') {
      throw new BadRequestException(
        `Không thể xóa vận đơn đang ở trạng thái "${existing.status}". Chỉ vận đơn ở trạng thái "preparing" mới được phép xóa.`,
      );
    }

    const { error: updateError } = await this.supabase
      .from('shipments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError)
      throw new InternalServerErrorException(updateError.message);

    return { success: true, message: `Đã hủy thành công vận đơn #${id}` };
  }
}
