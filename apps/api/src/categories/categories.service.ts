import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('[CategoriesService] findAll:', error);
      throw new InternalServerErrorException('Failed to fetch categories');
    }

    return data || [];
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return data;
  }

  async create(dto: CreateCategoryDto) {
    const { data, error } = await this.supabase.client
      .from('categories')
      .insert({
        name: dto.name,
        description: dto.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[CategoriesService] create:', error);
      throw new InternalServerErrorException('Failed to create category');
    }

    return data;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const { data, error } = await this.supabase.client
      .from('categories')
      .update({
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CategoriesService] update:', error);
      throw new InternalServerErrorException('Failed to update category');
    }

    return data;
  }

  async delete(id: number) {
    await this.findOne(id);

    const { error } = await this.supabase.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CategoriesService] delete:', error);
      throw new InternalServerErrorException('Failed to delete category');
    }

    return { success: true, message: `Category #${id} deleted` };
  }
}
