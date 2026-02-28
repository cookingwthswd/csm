// check-store-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from '../supabase.strategy';
import { Request } from 'express';
import { UserRoleEnum } from '../../users/dto/user.dto';

@Injectable()
export class CheckStoreAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser;
    const storeId = +request.params.storeId;

    // Others must match their store
    if (
      (user.role as UserRoleEnum) === UserRoleEnum.STORE_STAFF &&
      user.storeId !== storeId
    ) {
      throw new ForbiddenException('You can only access your own store');
    }

    return true;
  }
}
