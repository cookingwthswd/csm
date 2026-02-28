'use client';

import { useRef, useReducer } from 'react';
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

interface FormState {
  formData: CreateProductDto;
  saving: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'RESET'; formData: CreateProductDto }
  | { type: 'UPDATE'; updates: Partial<CreateProductDto> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      return { formData: action.formData, saving: false, error: null };
    case 'UPDATE':
      return { ...state, formData: { ...state.formData, ...action.updates } };
    case 'SUBMIT_START':
      return { ...state, saving: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, saving: false };
    case 'SUBMIT_ERROR':
      return { ...state, saving: false, error: action.error };
  }
}

function getInitialFormData(product: Product | null, categories: Category[]): CreateProductDto {
  if (product) {
    return {
      name: product.name,
      sku: product.sku ?? undefined,
      categoryId: product.categoryId ?? undefined,
      unit: product.unit as ItemUnit,
      type: product.type as ItemType,
      description: product.description ?? '',
      currentPrice: product.currentPrice ?? undefined,
    };
  }
  return {
    name: '',
    sku: '',
    categoryId: categories[0]?.id || 0,
    unit: 'pcs',
    type: 'material',
    description: '',
    currentPrice: undefined,
  };
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categories,
}: ProductFormModalProps) {
  const [state, dispatch] = useReducer(formReducer, {
    formData: getInitialFormData(editingProduct, categories),
    saving: false,
    error: null,
  });
  const prevOpenRef = useRef(isOpen);

  // Reset form when modal opens (React docs: adjusting state during render)
  if (isOpen && !prevOpenRef.current) {
    prevOpenRef.current = true;
    dispatch({ type: 'RESET', formData: getInitialFormData(editingProduct, categories) });
  } else if (!isOpen && prevOpenRef.current) {
    prevOpenRef.current = false;
  }

  const { formData, saving, error } = state;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_START' });

    try {
      await onSubmit(formData);
      dispatch({ type: 'SUBMIT_SUCCESS' });
      onClose();
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', error: err instanceof Error ? err.message : 'Failed to save' });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => dispatch({ type: 'UPDATE', updates: { name: e.target.value } })}
          required
          minLength={2}
          maxLength={255}
        />
        <Input
          label="SKU"
          value={formData.sku}
          onChange={(e) => dispatch({ type: 'UPDATE', updates: { sku: e.target.value } })}
          required
          minLength={2}
          maxLength={100}
        />
        <Select
          label="Category"
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={String(formData.categoryId)}
          onChange={(e) => dispatch({ type: 'UPDATE', updates: { categoryId: parseInt(e.target.value) } })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            options={ITEM_TYPE_OPTIONS}
            value={formData.type}
            onChange={(e) => dispatch({ type: 'UPDATE', updates: { type: e.target.value as ItemType } })}
            required
          />
          <Select
            label="Unit"
            options={ITEM_UNIT_OPTIONS}
            value={formData.unit}
            onChange={(e) => dispatch({ type: 'UPDATE', updates: { unit: e.target.value as ItemUnit } })}
            required
          />
        </div>
        <Input
          label="Current Price"
          type="number"
          min={0}
          step="any"
          value={formData.currentPrice ?? ''}
          onChange={(e) => dispatch({ type: 'UPDATE', updates: { currentPrice: e.target.value ? Number(e.target.value) : undefined } })}
        />
        <Textarea
          label="Description"
          value={formData.description || ''}
          onChange={(e) => dispatch({ type: 'UPDATE', updates: { description: e.target.value } })}
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
