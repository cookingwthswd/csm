// apps/api/src/common/factories/entity.factory.ts
// Abstract factory base for creating things with code generation
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EntityFactory<Entity, CreateDto> {
  protected generateCode(prefix: string): string {
    const timestamp = new Date().toISOString().replace(/\D/g, '').substring(0, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  abstract create(dto: CreateDto, ctx: any): Promise<Entity>;
}

export abstract class StatusFactory<S extends string> {
  protected abstract transitions: {
    from: S | S[];
    to: S;
    allowedRoles: string[];
  }[];

  canTransition(from: S, to: S, role: string): boolean {
    const transition = this.transitions.find(
      (t) => (Array.isArray(t.from) ? t.from.includes(from) : t.from === from) && t.to === to,
    );
    if (!transition) return false;
    return transition.allowedRoles.includes(role) || transition.allowedRoles.includes('admin');
  }
}
