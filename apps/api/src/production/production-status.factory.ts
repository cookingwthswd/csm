import { Injectable } from '@nestjs/common';
import { StatusFactory } from '../common/factories/base.factory';
import { ProductionStatusEnum } from '@repo/types';

@Injectable()
export class ProductionStatusFactory extends StatusFactory<ProductionStatusEnum> {
  protected transitions = [
    { from: 'planned' as const, to: 'in_progress' as const, allowedRoles: ['admin', 'manager', 'ck_staff'] },
    { from: 'in_progress' as const, to: 'completed' as const, allowedRoles: ['admin', 'manager', 'ck_staff'] },
    { from: 'planned' as const, to: 'cancelled' as const, allowedRoles: ['admin', 'manager'] },
  ];
}
