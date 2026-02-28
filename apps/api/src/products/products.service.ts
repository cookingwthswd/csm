import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/**
 * Products Service
 *
 * Manages products (items table): materials, semi-finished, finished products.
 */
@Injectable()
export class ProductsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get products with pagination and filters
   */
  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let builder = this.supabase.client
      .from('items')
      .select('*, categories(id, name)', { count: 'exact' });

    // Apply filters
    if (query.categoryId) {
      builder = builder.eq('category_id', query.categoryId);
    }
    if (query.type) {
      builder = builder.eq('type', query.type);
    }
    if (query.isActive !== undefined) {
      builder = builder.eq('is_active', query.isActive);
    }
    if (query.search) {
      builder = builder.or(
        `name.ilike.%${query.search}%,sku.ilike.%${query.search}%`,
      );
    }

    const { data, error, count } = await builder
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[ProductsService] findAll:', error);
      throw new InternalServerErrorException('Failed to fetch products');
    }

    return {
      data: this.transformProducts(data || []),
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get product by ID
   */
  async findOne(id: number) {
    const { data, error } = await this.supabase.client
      .from('items')
      .select('*, categories(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return this.transformProduct(data);
  }

  /**
   * Create new product
   */
  async create(dto: CreateProductDto) {
    // Check SKU uniqueness
    const { data: existing } = await this.supabase.client
      .from('items')
      .select('id')
      .eq('sku', dto.sku)
      .single();

    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const { data, error } = await this.supabase.client
      .from('items')
      .insert({
        name: dto.name,
        sku: dto.sku,
        category_id: dto.categoryId,
        unit: dto.unit,
        type: dto.type,
        description: dto.description || null,
        image_url: dto.imageUrl || null,
        is_active: dto.isActive ?? true,
      })
      .select('*, categories(id, name)')
      .single();

    if (error) {
      console.error('[ProductsService] create:', error);
      throw new InternalServerErrorException('Failed to create product');
    }

    return this.transformProduct(data);
  }

  /**
   * Update product
   */
  async update(id: number, dto: UpdateProductDto) {
    // Check exists
    await this.findOne(id);

    // Check SKU uniqueness if changing
    if (dto.sku) {
      const { data: existing } = await this.supabase.client
        .from('items')
        .select('id')
        .eq('sku', dto.sku)
        .neq('id', id)
        .single();

      if (existing) {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { data, error } = await this.supabase.client
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select('*, categories(id, name)')
      .single();

    if (error) {
      console.error('[ProductsService] update:', error);
      throw new InternalServerErrorException('Failed to update product');
    }

    return this.transformProduct(data);
  }

  /**
   * Soft delete product (set is_active = false)
   */
  async delete(id: number) {
    // Check exists
    await this.findOne(id);

    const { error } = await this.supabase.client
      .from('items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[ProductsService] delete:', error);
      throw new InternalServerErrorException('Failed to delete product');
    }

    return { success: true, message: `Product #${id} deactivated` };
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSFORM HELPERS
  // ═══════════════════════════════════════════════════════════

  private transformProducts(products: ProductRow[]) {
    return products.map((p) => this.transformProduct(p));
  }

  private transformProduct(product: ProductRow) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryId: product.category_id,
      categoryName: product.categories?.name || null,
      unit: product.unit,
      type: product.type,
      description: product.description,
      imageUrl: product.image_url,
      isActive: product.is_active,
      currentPrice: product.current_price,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  unit: string;
  type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  categories?: { id: number; name: string };
  current_price: number;
}
