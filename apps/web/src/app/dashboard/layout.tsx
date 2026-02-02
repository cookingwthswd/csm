'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';

/**
 * Dashboard Layout - Sidebar Navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      // Try signOut with timeout (Supabase can be slow)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 3000)
      );
      await Promise.race([signOut(), timeoutPromise]);
    } catch {
      // Ignore errors, continue with cleanup
    }

    // Clear persisted storage
    localStorage.removeItem('auth-storage');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Redirect using Next.js router
    router.refresh();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Please sign in to continue</p>
          <Link
            href="/login"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-gray-50">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">CKMS</h1>
          <p className="text-sm text-gray-500">Central Kitchen Management</p>
        </div>

        <nav className="mt-4 flex-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/orders">Orders</NavLink>
          <NavLink href="/dashboard/products">Products</NavLink>
          <NavLink href="/dashboard/categories">Categories</NavLink>
          <NavLink href="/dashboard/stores">Stores</NavLink>
          <NavLink href="/dashboard/users">Users</NavLink>
        </nav>

        <div className="border-t p-4">
          <Link
            href="/dashboard/profile"
            className="block truncate text-sm text-gray-600 hover:text-blue-600"
          >
            {user.email}
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`block px-4 py-2 ${
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}
