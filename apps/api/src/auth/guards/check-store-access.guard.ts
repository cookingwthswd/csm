// check-store-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../supabase.strategy';
import { Request } from 'express';
import { UserRoleEnum } from '../../users/dto/user.dto';
import { SupabaseService } from '../../common/services/supabase.service';

@Injectable()
export class CheckStoreAccessGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser;

    // If not store_staff, allow access (other roles have broader access)
    if ((user.role as UserRoleEnum) !== UserRoleEnum.STORE_STAFF) {
      return true;
    }

    // Check if storeId is in params (for /orders/store/:storeId)
    if (request.params.storeId) {
      const storeId = +request.params.storeId;
      if (user.storeId !== storeId) {
        throw new ForbiddenException('You can only access your own store');
      }
      return true;
    }

    // Check if orderId is in params (for /orders/:id)
    if (request.params.id) {
      const orderId = +request.params.id;

      // Fetch the order to check its storeId
      const { data: order, error } = await this.supabase.client
        .from('orders')
        .select('store_id')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        throw new NotFoundException('Order not found');
      }

      if (user.storeId !== order.store_id) {
        throw new ForbiddenException(
          'You can only access orders from your own store',
        );
      }
      return true;
    }

    // For POST /orders (create), check storeId in body
    if (
      request.method === 'POST' &&
      request.body &&
      'storeId' in request.body
    ) {
      const storeId = +(request.body as { storeId: number }).storeId;
      if (user.storeId !== storeId) {
        throw new ForbiddenException(
          'You can only create orders for your own store',
        );
      }
      return true;
    }

    // If no storeId or orderId in params, allow (will be handled by service layer)
    return true;
  }
}
