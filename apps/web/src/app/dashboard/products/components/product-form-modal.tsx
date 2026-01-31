'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Select, Button } from '@/components/ui';
import type { Product, CreateProductDto, Category, ItemType, ItemUnit } from '@repo/types';

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

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto) => Promise<void>;
  editingProduct: Product | null;
  categories: Category[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categories,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    sku: '',
    categoryId: 0,
    unit: 'pcs',
    type: 'material',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name,
          sku: editingProduct.sku ?? '',
          categoryId: editingProduct.categoryId ?? categories[0]?.id ?? 0,
          unit: editingProduct.unit as ItemUnit,
          type: editingProduct.type as ItemType,
          description: editingProduct.description || '',
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          categoryId: categories[0]?.id || 0,
          unit: 'pcs',
          type: 'material',
          description: '',
        });
      }
      setError(null);
    }
  }, [isOpen, editingProduct, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}
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
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={String(formData.categoryId)}
          onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            options={ITEM_TYPE_OPTIONS}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ItemType })}
            required
          />
          <Select
            label="Unit"
            options={ITEM_UNIT_OPTIONS}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value as ItemUnit })}
            required
          />
        </div>
        <Textarea
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={500}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingProduct ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
