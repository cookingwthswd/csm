'use client';

import { useEffect, useState, useCallback } from 'react';
import { productsApi, categoriesApi } from '@/lib/api';
import { Modal, Input, Textarea, Select, Button } from '@/components/ui';
import type {
  Product,
  CreateProductDto,
  Category,
  ItemType,
  ItemUnit,
} from '@repo/types';

const ITEM_TYPE_OPTIONS = [
  { value: 'material', label: 'Material' },
  { value: 'semi_finished', label: 'Semi-Finished' },
  { value: 'finished_product', label: 'Finished Product' },
];

const ITEM_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'pcs', label: 'pcs' },
  { value: 'box', label: 'box' },
  { value: 'can', label: 'can' },
  { value: 'pack', label: 'pack' },
];

/**
 * Products List Page with CRUD, Filters, Search
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    sku: '',
    categoryId: 0,
    unit: 'pcs',
    type: 'material',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        type: (typeFilter as ItemType) || undefined,
        categoryId: categoryFilter ? parseInt(categoryFilter) : undefined,
      });
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    // Load categories for dropdown
    categoriesApi.getAll().then(setCategories).catch(console.error);
  }, []);

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      categoryId: categories[0]?.id || 0,
      unit: 'pcs',
      type: 'material',
      description: '',
    });
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      unit: product.unit as ItemUnit,
      type: product.type as ItemType,
      description: product.description || '',
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }
      closeModal();
      loadProducts();
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
      await productsApi.delete(deleteId);
      setDeleteId(null);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  // Reset to page 1 when filters change
  function handleFilterChange(setter: (val: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <Button onClick={openCreateModal}>Add Product</Button>
      </div>

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
          className="rounded border p-2"
        />
        <select
          value={typeFilter}
          onChange={(e) => handleFilterChange(setTypeFilter)(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">All Types</option>
          {ITEM_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) =>
            handleFilterChange(setCategoryFilter)(e.target.value)
          }
          className="rounded border p-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
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
                <th className="p-3 font-medium text-gray-600">SKU</th>
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Category</th>
                <th className="p-3 font-medium text-gray-600">Type</th>
                <th className="p-3 font-medium text-gray-600">Unit</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{product.sku}</td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-gray-500">
                    {product.categoryName || '-'}
                  </td>
                  <td className="p-3">
                    <TypeBadge type={product.type} />
                  </td>
                  <td className="p-3">{product.unit}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openEditModal(product)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
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
          <Input
            label="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            minLength={2}
            maxLength={100}
          />
          <Select
            label="Category"
            options={categories.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            value={String(formData.categoryId)}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: parseInt(e.target.value) })
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={ITEM_TYPE_OPTIONS}
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as ItemType })
              }
              required
            />
            <Select
              label="Unit"
              options={ITEM_UNIT_OPTIONS}
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value as ItemUnit })
              }
              required
            />
          </div>
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            maxLength={500}
          />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Deactivate Product"
      >
        <p className="text-gray-600">
          Are you sure you want to deactivate this product? The product will be
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

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    material: 'bg-yellow-100 text-yellow-700',
    semi_finished: 'bg-orange-100 text-orange-700',
    finished_product: 'bg-green-100 text-green-700',
  };

  return (
    <span
      className={`rounded px-2 py-1 text-xs ${colors[type] || 'bg-gray-100'}`}
    >
      {type.replace('_', ' ')}
    </span>
  );
}
