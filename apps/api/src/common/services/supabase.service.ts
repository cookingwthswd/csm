/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * SupabaseService - Singleton Database Client
 *
 * Cung cấp single instance của Supabase client cho toàn bộ app.
 * Sử dụng SERVICE_ROLE_KEY để bypass RLS (Row Level Security).
 *
 * USAGE:
 * ```typescript
 * @Injectable()
 * export class OrdersService {
 *   constructor(private supabase: SupabaseService) {}
 *
 *   async findAll() {
 *     const { data } = await this.supabase.client
 *       .from('orders')
 *       .select('*');
 *     return data;
 *   }
 * }
 * ```
 *
 * NOTE: NestJS services are singleton by default (Scope.DEFAULT),
 * so this service is automatically shared across all modules.
 */
@Injectable()
export class SupabaseService {
  private readonly _client: SupabaseClient;
  private readonly _adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // Standard client for database operations
    this._client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Admin client for auth operations (create/delete users)
    this._adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Get the Supabase client instance
   * Use this for all database operations
   */
  get client(): SupabaseClient {
    return this._client;
  }

  /**
   * Get the admin client for auth operations
   * Use this for creating/deleting users via Supabase Admin API
   */
  get adminClient(): SupabaseClient {
    return this._adminClient;
  }

  /**
   * Alias for client getter (for consistency with existing code)
   */
  getClient(): SupabaseClient {
    return this._client;
  }
}
