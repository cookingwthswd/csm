import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import { CreateStoreDto, StoreQueryDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(private supabase: SupabaseService) {}

  async findAll(query: StoreQueryDto = {}) {
    let builder = this.supabase.client.from('stores').select('*');

    if (query.type) {
      builder = builder.eq('type', query.type);
    }
    if (query.is_active !== undefined) {
      builder = builder.eq('is_active', query.is_active);
    }

    const { data, error } = await builder.order('name');

    if (error) {
      console.error('[StoresService] findAll:', error);
      throw new InternalServerErrorException('Failed to fetch stores');
    }

    return this.transformStores(data || []);
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase.client
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Store #${id} not found`);
    }

    return this.transformStore(data);
  }

  async create(dto: CreateStoreDto) {
    const { data, error } = await this.supabase.client
      .from('stores')
      .insert({
        name: dto.name,
        address: dto.address || null,
        type: dto.type,
        phone: dto.phone || null,
        is_active: dto.is_active ?? true,
        settings: dto.settings || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[StoresService] create:', error);
      throw new InternalServerErrorException('Failed to create store');
    }

    return this.transformStore(data);
  }

  async update(id: number, dto: UpdateStoreDto) {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    if (dto.settings !== undefined) updateData.settings = dto.settings;

    const { data, error } = await this.supabase.client
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[StoresService] update:', error);
      throw new InternalServerErrorException('Failed to update store');
    }

    return this.transformStore(data);
  }

  async delete(id: number) {
    await this.findOne(id);

    const { error } = await this.supabase.client
      .from('stores')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[StoresService] delete:', error);
      throw new InternalServerErrorException('Failed to delete store');
    }

    return { success: true, message: `Store #${id} deactivated` };
  }

  private transformStores(stores: StoreRow[]) {
    return stores.map((s) => this.transformStore(s));
  }

  private transformStore(store: StoreRow) {
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      type: store.type,
      phone: store.phone,
      isActive: store.is_active,
      settings: store.settings,
      createdAt: store.created_at,
      updatedAt: store.updated_at,
    };
  }
}

interface StoreRow {
  id: number;
  name: string;
  address: string | null;
  type: string;
  phone: string | null;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
