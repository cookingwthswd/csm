'use client';

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
      <aside className="w-64 border-r bg-gray-50">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">CKMS</h1>
          <p className="text-sm text-gray-500">Central Kitchen Management</p>
        </div>

        <nav className="mt-4">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/categories">Categories</NavLink>
          <NavLink href="/dashboard/stores">Stores</NavLink>
          <NavLink href="/dashboard/products">Products</NavLink>
          <NavLink href="/dashboard/orders">Orders</NavLink>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 w-56">
          <div className="border-t pt-4">
            <p className="truncate text-sm text-gray-600">{user.email}</p>
            <button
              onClick={() => signOut()}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
    >
      {children}
    </Link>
  );
}
