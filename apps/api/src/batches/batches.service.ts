/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';

@Injectable()
export class BatchesService {

  private supabase: SupabaseClient<Database>;

  constructor(config: ConfigService) {

    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );

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
}
