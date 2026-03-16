import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../common/services';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateRoleDto,
  UserQueryDto,
} from './dto/user.dto';
import type { AuthUser } from '../auth/supabase.strategy';

export interface UserStatusActionResponse {
  success: true;
  message: string;
}

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findAll(query: UserQueryDto = {}) {
    let builder = this.supabase.client
      .from('users')
      .select('*, stores(id, name)');

    if (query.role) {
      builder = builder.eq('role', query.role);
    }
    if (query.storeId) {
      builder = builder.eq('store_id', query.storeId);
    }
    if (query.isActive !== undefined) {
      builder = builder.eq('is_active', query.isActive);
    }

    const { data, error } = await builder.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('[UsersService] findAll:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }

    return this.transformUsers(data || []);
  }

  async findMe(authUser: AuthUser) {
    return this.findOne(authUser.id);
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*, stores(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User not found`);
    }

    return this.transformUser(data);
  }

  async create(dto: CreateUserDto) {
    const { data: authData, error: authError } =
      await this.supabase.adminClient.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (authError) {
      console.error('[UsersService] create auth user:', authError);
      if (authError.message.includes('already been registered')) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }

    const userId = authData.user.id;

    const { data, error } = await this.supabase.client
      .from('users')
      .insert({
        id: userId,
        email: dto.email,
        full_name: dto.fullName || null,
        phone: dto.phone || null,
        role: dto.role,
        store_id: dto.storeId || null,
        is_active: true,
      })
      .select('*, stores(id, name)')
      .single();

    if (error) {
      console.error('[UsersService] create public user:', error);
      await this.supabase.adminClient.auth.admin.deleteUser(userId);
      throw new InternalServerErrorException('Failed to create user profile');
    }

    return this.transformUser(data);
  }

  async update(id: string, dto: UpdateUserDto, authUser: AuthUser) {
    if (authUser.role !== 'admin' && authUser.id !== id) {
      throw new ForbiddenException('Cannot update other users');
    }

    await this.findOne(id);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.fullName !== undefined) updateData.full_name = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    if (authUser.role === 'admin') {
      if (dto.storeId !== undefined) updateData.store_id = dto.storeId;
      if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    }

    const { data, error } = await this.supabase.client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*, stores(id, name)')
      .single();

    if (error) {
      console.error('[UsersService] update:', error);
      throw new InternalServerErrorException('Failed to update user');
    }

    return this.transformUser(data);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    const { data, error } = await this.supabase.client
      .from('users')
      .update({
        role: dto.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, stores(id, name)')
      .single();

    if (error) {
      console.error('[UsersService] updateRole:', error);
      throw new InternalServerErrorException('Failed to update role');
    }

    return this.transformUser(data);
  }

  async deactivate(id: string): Promise<UserStatusActionResponse> {
    const user = await this.findOne(id);

    if (!user.isActive) {
      return { success: true, message: 'User is already inactive' };
    }

    const { error } = await this.supabase.client
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[UsersService] deactivate:', error);
      throw new InternalServerErrorException('Failed to deactivate user');
    }

    return { success: true, message: 'User deactivated' };
  }

  async activate(id: string): Promise<UserStatusActionResponse> {
    const user = await this.findOne(id);

    if (user.isActive) {
      return { success: true, message: 'User is already active' };
    }

    const { error } = await this.supabase.client
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[UsersService] activate:', error);
      throw new InternalServerErrorException('Failed to activate user');
    }

    return { success: true, message: 'User activated' };
  }

  private transformUsers(users: UserRow[]) {
    return users.map((u) => this.transformUser(u));
  }

  private transformUser(user: UserRow) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      storeId: user.store_id,
      store: user.stores
        ? { id: user.stores.id, name: user.stores.name }
        : null,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  store_id: number | null;
  stores: { id: number; name: string } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
