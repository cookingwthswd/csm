'use client';

import { useAuthStore, type UserRole } from '@/lib/stores/auth.store';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Role Guard - Restricts content to specific user roles
 *
 * @example
 * <RoleGuard roles={['admin', 'manager']}>
 *   <AdminContent />
 * </RoleGuard>
 */
export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { profile, isLoading, isProfileLoading } = useAuthStore();

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return (
      fallback ?? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Access Denied</p>
            <p className="mt-1 text-sm text-gray-400">
              You don&apos;t have permission to view this content.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
