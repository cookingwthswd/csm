import { api } from './client';
import type { UserRole } from '@/lib/stores/auth.store';

/**
 * User response from API
 */
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  storeId: number | null;
  store: { id: number; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  storeId?: number;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  storeId?: number;
  isActive?: boolean;
}

/**
 * Update role request
 */
export interface UpdateRoleRequest {
  role: UserRole;
}

/**
 * User query params
 */
export interface UserQueryParams {
  role?: UserRole;
  storeId?: number;
  isActive?: boolean;
}

/**
 * Users API client
 */
export const usersApi = {
  /**
   * Get all users with optional filters
   */
  getAll: (params?: UserQueryParams) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.storeId) query.set('storeId', params.storeId.toString());
    if (params?.isActive !== undefined)
      query.set('isActive', params.isActive.toString());

    const queryString = query.toString();
    return api.get<User[]>(`/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get current user profile
   */
  getMe: () => api.get<User>('/users/me'),

  /**
   * Get user by ID
   */
  getById: (id: string) => api.get<User>(`/users/${id}`),

  /**
   * Create new user (admin only)
   */
  create: (data: CreateUserRequest) => api.post<User>('/users', data),

  /**
   * Update user profile
   */
  update: (id: string, data: UpdateUserRequest) =>
    api.put<User>(`/users/${id}`, data),

  /**
   * Update user role (admin only)
   */
  updateRole: (id: string, data: UpdateRoleRequest) =>
    api.put<User>(`/users/${id}/role`, data),

  /**
   * Deactivate user (admin only)
   */
  deactivate: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/users/${id}`),

  /**
   * Reactivate user (admin only)
   */
  activate: (id: string) =>
    api.put<{ success: boolean; message: string }>(`/users/${id}/activate`, {}),
};
