/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';

@Injectable()
export class InventoriesService {

  private supabase: SupabaseClient<Database>;

  constructor(config: ConfigService) {

    this.supabase = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );

  }

  /**
   * Inventory list
   */
  async getInventories() {

    const { data, error } = await this.supabase
      .from('inventory_store_summary')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

  /**
   * Inventory detail by store
   */
  async getInventoryByStore(storeId: number) {

    const { data, error } = await this.supabase
      .from('inventory')
      .select(`
        *,
        items(id,name)
      `)
      .eq('store_id', storeId)
      .order('item_id');

    if (error)
      throw new InternalServerErrorException(error.message);

    return data;
  }

}
