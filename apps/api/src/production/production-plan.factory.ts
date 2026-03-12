import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityFactory } from '../common/factories/base.factory';
import { CreatePlanDto } from './dto/production.dto';
import { SupabaseService } from '../common/services/supabase.service';
import { Database } from '@repo/types';

type ProductionPlan = Database['public']['Tables']['production_plans']['Row'];

@Injectable()
export class ProductionPlanFactory extends EntityFactory<ProductionPlan, CreatePlanDto> {
  constructor(private supabase: SupabaseService) {
    super();
  }

  async create(dto: CreatePlanDto, ctx: { userId?: string }): Promise<ProductionPlan> {
    const planCode = this.generateCode('PP');

    // Check if user exists in public.users before setting created_by
    let createdBy: string | null = null;
    if (ctx.userId) {
      const { data: user } = await this.supabase.getClient()
        .from('users')
        .select('id')
        .eq('id', ctx.userId)
        .single();
      if (user) createdBy = ctx.userId;
    }

    // Insert plan
    const { data: plan, error: planError } = await this.supabase.getClient()
      .from('production_plans')
      .insert({
        plan_code: planCode,
        start_date: dto.startDate,
        end_date: dto.endDate,
        notes: dto.notes,
        status: 'planned',
        created_by: createdBy,
      })
      .select()
      .single();

    if (planError || !plan) {
      throw new InternalServerErrorException('Failed to create production plan: ' + (planError?.message || 'unknown error'));
    }

    // Insert details
    if (dto.details && dto.details.length > 0) {
      const detailsToInsert = dto.details.map((detail) => ({
        plan_id: plan.id,
        item_id: detail.itemId,
        quantity_planned: detail.quantityPlanned,
        status: 'pending',
      }));

      const { error: detailsError } = await this.supabase.getClient()
        .from('production_details')
        .insert(detailsToInsert);

      if (detailsError) {
        // Rollback plan if details fail (ideally use DB functions for transaction)
        await this.supabase.getClient().from('production_plans').delete().eq('id', plan.id);
        throw new InternalServerErrorException('Failed to create production details: ' + detailsError.message);
      }
    }

    return plan;
  }

  async createFromOrder(orderId: number, ctx: { userId: string }): Promise<ProductionPlan> {
    const client = this.supabase.getClient();

    // 1. Get order items
    const { data: orderItems, error: itemsError } = await client
      .from('order_items')
      .select('item_id, quantity_ordered')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      throw new InternalServerErrorException(`Could not get order items for order ${orderId}`);
    }

    // 2. Create plan with items as details (using today as start date)
    const today = new Date().toISOString().slice(0, 10);
    const createDto: CreatePlanDto = {
      startDate: today,
      notes: `Auto-generated from Order #${orderId}`,
      details: orderItems.map((item) => ({
        itemId: item.item_id,
        quantityPlanned: item.quantity_ordered,
      })),
    };

    return this.create(createDto, ctx);
  }
}
