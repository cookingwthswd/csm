import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
} from 'class-validator';

// Valid roles matching database CHECK constraint
export const VALID_ROLES = [
  'admin',
  'manager',
  'ck_staff',
  'store_staff',
  'coordinator',
] as const;
export type UserRole = (typeof VALID_ROLES)[number];

export enum UserRoleEnum {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CK_STAFF = 'ck_staff',
  STORE_STAFF = 'store_staff',
  COORDINATOR = 'coordinator',
}

/**
 * Create User DTO
 * Used by admin to create new users
 */
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(VALID_ROLES)
  role: UserRole;

  @IsOptional()
  @IsInt()
  storeId?: number;
}

/**
 * Update User DTO
 * Used by admin or self to update user profile
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Update Role DTO
 * Used by admin only to change user role
 */
export class UpdateRoleDto {
  @IsIn(VALID_ROLES)
  role: UserRole;
}

/**
 * User Query DTO
 * For filtering user list
 */
export class UserQueryDto {
  @IsOptional()
  @IsIn(VALID_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
