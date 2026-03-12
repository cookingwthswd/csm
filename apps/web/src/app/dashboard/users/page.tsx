'use client';

import { useEffect, useState } from 'react';
import { usersApi, type User, type CreateUserRequest } from '@/lib/api/users';
import { storesApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { useAuth } from '@/providers';
import {
  UserFormModal,
  RoleChangeModal,
  DeactivateModal,
} from './components';
import type { Store } from '@repo/types';
import type { UserRole } from '@/lib/stores/auth.store';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'ck_staff', label: 'CK Staff' },
  { value: 'store_staff', label: 'Store Staff' },
  { value: 'coordinator', label: 'Coordinator' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  ck_staff: 'bg-orange-100 text-orange-700',
  store_staff: 'bg-blue-100 text-blue-700',
  coordinator: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const { isAdmin, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [statusUser, setStatusUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, [roleFilter, storeFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [usersData, storesData] = await Promise.all([
        usersApi.getAll({
          role: roleFilter as UserRole | undefined,
          storeId: storeFilter ? parseInt(storeFilter) : undefined,
        }),
        storesApi.getAll(),
      ]);
      setUsers(usersData);
      setStores(storesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(data: CreateUserRequest) {
    if (editingUser) {
      await usersApi.update(editingUser.id, {
        fullName: data.fullName || undefined,
        phone: data.phone || undefined,
        storeId: data.storeId,
      });
    } else {
      await usersApi.create(data);
    }
    loadData();
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    await usersApi.updateRole(userId, { role });
    loadData();
  }

  async function handleDeactivate(userId: string) {
    await usersApi.deactivate(userId);
    loadData();
  }

  async function handleActivate(userId: string) {
    await usersApi.activate(userId);
    loadData();
  }

  async function handleStatusChange(userId: string) {
    const user = users.find((item) => item.id === userId);
    if (!user) return;

    if (user.isActive) {
      await handleDeactivate(userId);
      return;
    }

    await handleActivate(userId);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        {isAdmin() && (
          <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }}>
            Add User
          </Button>
        )}
      </div>

      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}

      {/* Filters */}
      <div className="mt-4 flex gap-4">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded border p-2">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="rounded border p-2">
          <option value="">All Stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mt-6">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium text-gray-600">Email</th>
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Role</th>
                <th className="p-3 font-medium text-gray-600">Store</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 font-medium">{user.fullName || '-'}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${ROLE_COLORS[user.role] || 'bg-gray-100'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{user.store?.name || '-'}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {profile?.id === user.id && (
                      <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        Current account
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => { setEditingUser(user); setIsFormOpen(true); }} className="mr-2 text-blue-600 hover:text-blue-800">Edit</button>
                    {isAdmin() && (
                      <>
                        <button onClick={() => setRoleChangeUser(user)} className="mr-2 text-purple-600 hover:text-purple-800">Role</button>
                        {profile?.id === user.id ? (
                          <span className="text-sm text-gray-400">
                            Cannot deactivate current account
                          </span>
                        ) : (
                          <button
                            onClick={() => setStatusUser(user)}
                            className={`mr-2 ${user.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <UserFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} editingUser={editingUser} stores={stores} />
      <RoleChangeModal user={roleChangeUser} onClose={() => setRoleChangeUser(null)} onConfirm={handleRoleChange} />
      <DeactivateModal user={statusUser} onClose={() => setStatusUser(null)} onConfirm={handleStatusChange} />
    </div>
  );
}
