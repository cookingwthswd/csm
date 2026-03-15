/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';

@Injectable()
export class BatchesService {

  private supabase: SupabaseClient<Database>;

  constructor(config: ConfigService) {

    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );

  }

  private formatTimestamp(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }

  private async generateBatchCode(): Promise<string> {
    const timestamp = this.formatTimestamp(new Date());
    const prefix = `BAT-${timestamp}-`;

    const { data, error } = await this.supabase
      .from('batches')
      .select('batch_code')
      .like('batch_code', `${prefix}%`);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const maxSeq = (data ?? []).reduce((max, row) => {
      const code = row.batch_code ?? '';
      const seq = Number(code.slice(prefix.length));
      if (!Number.isNaN(seq) && seq > max) return seq;
      return max;
    }, 0);

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }
  /**
   * Batches list
   */
  async getBatches() {

    const { data, error } = await this.supabase
      .from('batches')
      .select(`
        *,
        items(id,name)
      `)
      .order('expiry_date', { ascending: true });

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

  /**
   * Batch detail
   */
  async getBatchDetail(batchId: number) {

    const { data, error } = await this.supabase
      .from('batches')
      .select(`
        *,
        items(id,name)
      `)
      .eq('id', batchId)
      .single();

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

  /**
   * Batch transaction history
   */
  async getBatchTransactions(batchId: number) {

    const { data, error } = await this.supabase
      .from('inventory_transactions')
      .select(`
        *,
        stores(id,name),
        items(id,name),
        batches(batch_code)
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

  async create(dto: CreateBatchDto) {
    const initialQuantity = dto.initial_quantity;
    const currentQuantity = dto.current_quantity ?? initialQuantity;
    const batchCode = await this.generateBatchCode();

    if (currentQuantity > initialQuantity) {
      throw new BadRequestException(
        'Current quantity cannot be greater than initial quantity',
      );
    }

    const { data, error } = await this.supabase
      .from('batches')
      .insert({
        batch_code: batchCode,
        item_id: dto.item_id,
        manufacture_date: dto.manufacture_date,
        expiry_date: dto.expiry_date,
        initial_quantity: initialQuantity,
        current_quantity: currentQuantity,
        status: dto.status ?? 'active',
      })
      .select(
        `
        *,
        items(id,name)
      `,
      )
      .single();

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

  async update(batchId: number, dto: UpdateBatchDto) {
    const { data: existing, error: fetchError } = await this.supabase
      .from('batches')
      .select('id, initial_quantity, current_quantity')
      .eq('id', batchId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Batch #${batchId} not found`);
    }

    const nextInitial = dto.initial_quantity ?? existing.initial_quantity;
    const nextCurrent = dto.current_quantity ?? existing.current_quantity;

    if (nextCurrent > nextInitial) {
      throw new BadRequestException(
        'Current quantity cannot be greater than initial quantity',
      );
    }

    const { data, error } = await this.supabase
      .from('batches')
      .update({
        batch_code: dto.batch_code,
        item_id: dto.item_id,
        manufacture_date: dto.manufacture_date,
        expiry_date: dto.expiry_date,
        initial_quantity: dto.initial_quantity,
        current_quantity: dto.current_quantity,
        status: dto.status,
      })
      .eq('id', batchId)
      .select(
        `
        *,
        items(id,name)
      `,
      )
      .single();

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }
}
