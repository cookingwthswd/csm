'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Auth Guard - Protects routes requiring authentication
 *
 * @example
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/login',
}: AuthGuardProps) {
  const router = useRouter();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace(redirectTo);
    }
  }, [isLoading, session, router, redirectTo]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      )
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
