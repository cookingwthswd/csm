import { z } from 'zod';

/**
 * Auth Types for CKMS
 *
 * Zod 4.x Changes:
 * - z.string().email() → DEPRECATED → use z.email()
 * - z.string().uuid() → DEPRECATED → use z.uuid()
 */

// ═══════════════════════════════════════════════════════════
// USER ROLES
// ═══════════════════════════════════════════════════════════

export const UserRole = z.enum([
  'admin',
  'manager',
  'ck_staff',
  'store_staff',
  'coordinator',
]);
export type UserRole = z.infer<typeof UserRole>;

// ═══════════════════════════════════════════════════════════
// AUTH USER
// ═══════════════════════════════════════════════════════════

export const AuthUser = z.object({
  id: z.uuid(),      // Zod 4.x: z.uuid() instead of z.string().uuid()
  email: z.email(),  // Zod 4.x: z.email() instead of z.string().email()
  chainId: z.number().int().positive(),
  role: UserRole,
});
export type AuthUser = z.infer<typeof AuthUser>;

// ═══════════════════════════════════════════════════════════
// JWT PAYLOAD
// ═══════════════════════════════════════════════════════════

export const JwtPayload = z.object({
  sub: z.uuid(),
  email: z.email(),
  app_metadata: z.object({
    chain_id: z.number(),
    role: UserRole,
  }),
  aud: z.string(),
  exp: z.number(),
});
export type JwtPayload = z.infer<typeof JwtPayload>;
