import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

export interface AuthUser {
  id: string;
  email: string;
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

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.app_metadata.role,
      storeId: payload.app_metadata.store_id,
    };
  }
}
