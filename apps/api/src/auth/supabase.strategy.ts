import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * JWT Payload từ Supabase
 *
 * app_metadata được inject bởi custom_access_token_hook function
 * trong Supabase Database (xem migrations/20260117000002_custom_access_token_hook.sql)
 *
 * Hook này query public.users để lấy role và store_id,
 * sau đó inject vào JWT claims
 */
export interface JwtPayload {
  sub: string;
  email: string;
  app_metadata: {
    role: string;
    store_id: number | null;
  };
  aud: string;
  exp: number;
}

/**
 * AuthUser - User object sau khi validate JWT
 *
 * Được inject vào controllers qua @CurrentUser() decorator
 * Chứa thông tin cần thiết cho authorization và data isolation
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  storeId: number | null;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService.getOrThrow<string>('SUPABASE_URL');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use JWKS endpoint for ES256 verification
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
    });
  }

  /**
   * Validate JWT và extract user info từ app_metadata
   *
   * app_metadata.role và app_metadata.store_id được inject bởi
   * custom_access_token_hook function trong Supabase
   *
   * Nếu thiếu role → throw UnauthorizedException
   * (có thể do hook chưa enable hoặc user chưa có trong public.users)
   */
  validate(payload: JwtPayload): AuthUser {
    if (!payload.app_metadata?.role) {
      throw new UnauthorizedException(
        'Missing role in token. Check: 1) User exists in public.users with role, 2) custom_access_token_hook is enabled in Supabase Dashboard',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.app_metadata.role,
      storeId: payload.app_metadata.store_id ?? null,
    };
  }
}
