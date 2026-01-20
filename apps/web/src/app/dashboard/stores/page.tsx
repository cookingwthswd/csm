'use client';

import { useEffect, useState } from 'react';
import { storesApi } from '@/lib/api';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { Store, CreateStoreDto, StoreType } from '@repo/types';

const STORE_TYPE_OPTIONS = [
  { value: 'franchise', label: 'Franchise' },
  { value: 'central_kitchen', label: 'Central Kitchen' },
];

/**
 * Stores List Page with CRUD
 */
export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<CreateStoreDto>({
    name: '',
    type: 'franchise',
    address: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStores();
  }, [typeFilter]);

  async function loadStores() {
    try {
      setLoading(true);
      setError(null);
      const data = await storesApi.getAll({
        type: typeFilter as StoreType | undefined,
      });
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingStore(null);
    setFormData({ name: '', type: 'franchise', address: '', phone: '' });
    setIsModalOpen(true);
  }

  function openEditModal(store: Store) {
    setEditingStore(store);
    setFormData({
      name: store.name,
      type: store.type as StoreType,
      address: store.address || '',
      phone: store.phone || '',
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingStore(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingStore) {
        await storesApi.update(editingStore.id, formData);
      } else {
        await storesApi.create(formData);
      }
      closeModal();
      loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      await storesApi.delete(deleteId);
      setDeleteId(null);
      loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
        <Button onClick={openCreateModal}>Add Store</Button>
      </div>

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {/* Filters */}
      <div className="mt-4 flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">All Types</option>
          {STORE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium text-gray-600">ID</th>
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Type</th>
                <th className="p-3 font-medium text-gray-600">Phone</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{store.id}</td>
                  <td className="p-3 font-medium">{store.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        store.type === 'central_kitchen'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {store.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{store.phone || '-'}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        store.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openEditModal(store)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(store.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No stores found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStore ? 'Edit Store' : 'Add Store'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={2}
            maxLength={255}
          />
          <Select
            label="Type"
            options={STORE_TYPE_OPTIONS}
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as StoreType })
            }
            required
          />
          <Input
            label="Address"
            value={formData.address || ''}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            maxLength={500}
          />
          <Input
            label="Phone"
            value={formData.phone || ''}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            maxLength={20}
          />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingStore ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Deactivate Store"
      >
        <p className="text-gray-600">
          Are you sure you want to deactivate this store? The store will be
          marked as inactive.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
