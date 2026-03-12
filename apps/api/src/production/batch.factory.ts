import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityFactory } from '../common/factories/base.factory';
import { CreateBatchDto } from './dto/production.dto';
import { SupabaseService } from '../common/services/supabase.service';
import { Database } from '@repo/types';

type Batch = Database['public']['Tables']['batches']['Row'];

@Injectable()
export class BatchFactory extends EntityFactory<Batch, CreateBatchDto> {
  constructor(private supabase: SupabaseService) {
    super();
  }

  async create(dto: CreateBatchDto, ctx: { userId: string; storeId?: number }): Promise<Batch> {
    const client = this.supabase.getClient();
    const batchCode = this.generateCode('BAT');

    // Insert batch
    const { data: batch, error: batchError } = await client
      .from('batches')
      .insert({
        batch_code: batchCode,
        item_id: dto.itemId,
        manufacture_date: dto.manufactureDate,
        expiry_date: dto.expiryDate,
        initial_quantity: dto.initialQuantity,
        current_quantity: dto.initialQuantity,
        status: 'active',
      })
      .select()
      .single();

    if (batchError || !batch) {
      throw new InternalServerErrorException('Failed to create batch: ' + batchError?.message);
    }

    // If linked to production detail, update it
    if (dto.productionDetailId) {
      await client
        .from('production_details')
        .update({ batch_id: batch.id })
        .eq('id', dto.productionDetailId);
    }

    // IMPORTANT: Let Inventory service handle the inventory transactions securely via API or service calls.
    // If not using InventoryService here directly, we assume production.service orchestrates it.

    return batch;
  }
}
