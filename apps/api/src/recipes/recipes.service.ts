import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { UpdateRecipeDto } from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    // Return list of products that have recipes
    const { data, error } = await this.supabase.getClient()
      .from('items')
      .select('id, name, type, recipe_details:recipe_details!product_id(count)')
      .in('type', ['finished_product', 'semi_finished']);

    if (error) throw new BadRequestException(error.message);

    // Filter only those with recipes
    return data.filter(item => (item.recipe_details as any)[0]?.count > 0);
  }

  async findByProductId(productId: number) {
    const { data: product, error: productErr } = await this.supabase.getClient()
      .from('items')
      .select('id, name, type, recipe_details!product_id(id, material_id, quantity, items!material_id(name, unit))')
      .eq('id', productId)
      .in('type', ['finished_product', 'semi_finished'])
      .single();

    if (productErr || !product) throw new NotFoundException('Product not found or not a product type');

    return product;
  }

  async saveRecipe(dto: UpdateRecipeDto) {
    const { data: product, error: productErr } = await this.supabase.getClient()
      .from('items')
      .select('id, type')
      .eq('id', dto.productId)
      .single();

    if (productErr || !product) throw new NotFoundException('Product not found');
    if (product.type === 'material') throw new BadRequestException('Cannot attach recipes to raw materials');

    // To perform a transactional replace, we first delete existing details, then insert new ones.
    const { error: delErr } = await this.supabase.getClient()
      .from('recipe_details')
      .delete()
      .eq('product_id', dto.productId);

    if (delErr) throw new BadRequestException('Failed to clear old recipe details');

    const detailsToInsert = dto.materials.map(mat => ({
      product_id: dto.productId,
      material_id: mat.materialId,
      quantity: mat.quantity,
    }));

    const { data, error: insErr } = await this.supabase.getClient()
      .from('recipe_details')
      .insert(detailsToInsert)
      .select();

    if (insErr) throw new BadRequestException(insErr.message);

    return this.findByProductId(dto.productId);
  }

  async deleteRecipeDetail(id: number) {
    const { error } = await this.supabase.getClient()
      .from('recipe_details')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}
