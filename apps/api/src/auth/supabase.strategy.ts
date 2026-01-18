import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Payload từ Supabase
 *
 * Supabase Auth tự động thêm app_metadata vào JWT
 * khi user đăng ký hoặc qua custom_access_token_hook
 */
export interface JwtPayload {
  sub: string;
  email: string;
  app_metadata: {
    chain_id: number; // Chain user thuộc về
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
  chainId: number; // Dùng để filter data theo chain
  role: string;
  storeId: number | null;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('SUPABASE_JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload.app_metadata?.role) {
      throw new UnauthorizedException('Missing role in token');
    }
    if (!payload.app_metadata?.chain_id) {
      throw new UnauthorizedException('Missing chain_id in token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      chainId: payload.app_metadata.chain_id,
      role: payload.app_metadata.role,
      storeId: payload.app_metadata.store_id,
    };
  }
}
