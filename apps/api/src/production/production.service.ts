import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { ProductionPlanFactory } from './production-plan.factory';
import { BatchFactory } from './batch.factory';
import { ProductionStatusFactory } from './production-status.factory';
import { CreatePlanDto, UpdatePlanDto, UpdatePlanStatusDto, UpdateProductionDetailDto, CreateBatchDto } from './dto/production.dto';
import { AuthUser } from '../auth';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductionService {
  constructor(
    private supabase: SupabaseService,
    private planFactory: ProductionPlanFactory,
    private batchFactory: BatchFactory,
    private statusFactory: ProductionStatusFactory,
    private readonly notifications: NotificationsService,
  ) {}

  async findAllPlans(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { data, count, error } = await this.supabase.getClient()
      .from('production_plans')
      .select('*, users!created_by(full_name, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findPlanById(id: number) {
    const { data, error } = await this.supabase.getClient()
      .from('production_plans')
      .select('*, production_details(*, items(name, type)), users!created_by(full_name, role)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Production plan not found');
    return data;
  }

  async createPlan(dto: CreatePlanDto, user: AuthUser) {
    return this.planFactory.create(dto, { userId: user.id });
  }

  async updatePlan(id: number, dto: UpdatePlanDto, user: AuthUser) {
    const { data: plan } = await this.supabase.getClient()
      .from('production_plans')
      .select('status')
      .eq('id', id)
      .single();

    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.status !== 'planned') throw new ForbiddenException('Can only update planned production');

    const { data, error } = await this.supabase.getClient()
      .from('production_plans')
      .update({
        start_date: dto.startDate,
        end_date: dto.endDate,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updatePlanStatus(id: number, dto: UpdatePlanStatusDto, user: AuthUser) {
    const { data: plan } = await this.supabase.getClient()
      .from('production_plans')
      .select('status')
      .eq('id', id)
      .single();

    if (!plan) throw new NotFoundException('Plan not found');

    if (!this.statusFactory.canTransition(plan.status as any, dto.status, user.role)) {
      throw new ForbiddenException(`Cannot transition from ${plan.status} to ${dto.status} with role ${user.role}`);
    }

    // Logic: If transitioning to "completed", ensure all details are resolved
    // We assume production staff update details before completing the plan.

    const { data, error } = await this.supabase.getClient()
      .from('production_plans')
      .update({
        status: dto.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Notify: production plan status changed
    if (dto.status === 'completed') {
      this.notifications.notifyProductionCompleted(user.id, `Plan #${id}`).catch(() => {});
    }

    return data;
  }

  async updateDetailQuantity(planId: number, detailId: number, dto: UpdateProductionDetailDto) {
    const { data: detail } = await this.supabase.getClient()
      .from('production_details')
      .select('plan_id, status')
      .eq('id', detailId)
      .single();

    if (!detail || detail.plan_id !== planId) throw new NotFoundException('Detail not found');

    const { data, error } = await this.supabase.getClient()
      .from('production_details')
      .update({
        quantity_produced: dto.quantityProduced,
      })
      .eq('id', detailId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async finishDetailAndCreateBatch(planId: number, detailId: number, user: AuthUser) {
    // 1. Get detail info
    const { data: detail, error: detailErr } = await this.supabase.getClient()
      .from('production_details')
      .select('*, items(*)')
      .eq('id', detailId)
      .single();
    
    if (detailErr || !detail) throw new NotFoundException('Detail not found');
    if (detail.plan_id !== planId) throw new BadRequestException('Detail does not belong to this plan');
    if (detail.status === 'completed') throw new BadRequestException('Detail already completed');
    if (detail.quantity_produced == null) throw new BadRequestException('Produce quantity first before complete');

    // 2. Set detail completed
    const { error: updErr } = await this.supabase.getClient()
      .from('production_details')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', detailId);

    if (updErr) throw new BadRequestException('Could not update detail status');

    // 3. Create batch
    const manufactureDate = new Date().toISOString().slice(0, 10);
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // Default +30 days (business logic)
    
    const batchDto: CreateBatchDto = {
      itemId: detail.item_id,
      manufactureDate,
      expiryDate,
      initialQuantity: detail.quantity_produced,
      productionDetailId: detailId,
    };

    const batch = await this.batchFactory.create(batchDto, { userId: user.id });

    // 4. Update CK inventory
    const { data: ckStore } = await this.supabase.getClient()
      .from('stores')
      .select('id')
      .eq('type', 'central_kitchen')
      .single();

    const ckStoreId = ckStore?.id ?? 1;

    // Get recipe for this product
    const { data: recipeDetails } = await this.supabase.getClient()
      .from('recipe_details')
      .select('material_id, quantity')
      .eq('product_id', detail.item_id);

    // 4a. Deduct raw materials from CK inventory
    for (const rd of recipeDetails || []) {
      const deductQty = rd.quantity * detail.quantity_produced;

      // Use maybeSingle() — returns null data (no error) when row not found
      const { data: invRow } = await this.supabase.getClient()
        .from('inventory')
        .select('id, quantity')
        .eq('store_id', ckStoreId)
        .eq('item_id', rd.material_id)
        .maybeSingle();

      if (invRow) {
        const newQty = Math.max(0, invRow.quantity - deductQty);
        const { error: deductErr } = await this.supabase.getClient()
          .from('inventory')
          .update({ quantity: newQty })
          .eq('id', invRow.id);

        if (deductErr) throw new BadRequestException(`Failed to deduct material ${rd.material_id}: ${deductErr.message}`);
      }
    }

    // 4b. Add finished product to CK inventory
    const { data: productInv } = await this.supabase.getClient()
      .from('inventory')
      .select('id, quantity')
      .eq('store_id', ckStoreId)
      .eq('item_id', detail.item_id)
      .maybeSingle();

    if (productInv) {
      const { error: addErr } = await this.supabase.getClient()
        .from('inventory')
        .update({ quantity: productInv.quantity + detail.quantity_produced })
        .eq('id', productInv.id);

      if (addErr) throw new BadRequestException(`Failed to add product to inventory: ${addErr.message}`);
    } else {
      const { error: insErr } = await this.supabase.getClient()
        .from('inventory')
        .insert({ store_id: ckStoreId, item_id: detail.item_id, quantity: detail.quantity_produced });

      if (insErr) throw new BadRequestException(`Failed to create product inventory: ${insErr.message}`);
    }

    // Notify: batch completed
    const itemName = (detail.items as any)?.name ?? `Item #${detail.item_id}`;
    this.notifications.notifyProductionCompleted(user.id, `${itemName} x${detail.quantity_produced}`).catch(() => {});

    return batch;
  }

  async calculateMaterialsRequired(planId: number) {
    // Implement standard algorithm with Supabase
    const { data: details, error } = await this.supabase.getClient()
      .from('production_details')
      .select(`
        quantity_planned,
        items!inner (
          id, name,
          recipe_details!product_id (
            material_id, quantity,
            items!material_id (name, unit)
          )
        )
      `)
      .eq('plan_id', planId);

    if (error) throw new BadRequestException(error.message);
    
    const materialMap = new Map<number, any>();

    for (const detail of details || []) {
      const qPlanned = detail.quantity_planned;
      const rDetails = (detail.items as any)?.recipe_details || [];
      
      for (const rd of rDetails) {
        const matId = rd.material_id;
        const matInfo = rd.items;
        const totalNeeded = rd.quantity * qPlanned;

        if (materialMap.has(matId)) {
          materialMap.get(matId).requiredQuantity += totalNeeded;
        } else {
          materialMap.set(matId, {
            materialId: matId,
            materialName: matInfo?.name,
            unit: matInfo?.unit,
            requiredQuantity: totalNeeded,
          });
        }
      }
    }

    // Now get the Central Kitchen inventory — look up CK store dynamically
    const materialIds = Array.from(materialMap.keys());
    if (materialIds.length > 0) {
      const { data: ckStore } = await this.supabase.getClient()
        .from('stores')
        .select('id')
        .eq('type', 'central_kitchen')
        .single();

      const ckStoreId = ckStore?.id ?? 1;

      const { data: inv } = await this.supabase.getClient()
        .from('inventory')
        .select('item_id, quantity')
        .eq('store_id', ckStoreId)
        .in('item_id', materialIds);

      const invMap = new Map(inv?.map(i => [i.item_id, i.quantity]) || []);

      for (const mat of materialMap.values()) {
        const stock = invMap.get(mat.materialId) || 0;
        mat.currentStock = stock;
        mat.shortage = Math.max(0, mat.requiredQuantity - stock);
      }
    }

    return Array.from(materialMap.values());
  }

  // BATCHES
  async findAllBatches(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { data, count, error } = await this.supabase.getClient()
      .from('batches')
      .select('*, items(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return {
      data,
      meta: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    };
  }
}
