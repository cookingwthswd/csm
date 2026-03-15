"use client";

import { useEffect, useState } from "react";
import {
  batchesApi,
  type BatchRecord,
  type CreateBatchPayload,
} from "@/lib/api/batches";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select } from "@/components/ui";
import { productsApi } from "@/lib/api/products";
import { useAuthStore, type UserRole } from "@/lib/stores/auth.store";

type BatchStatus = "active" | "expired" | "depleted";
type StatusFilter = "all" | BatchStatus;

interface ItemOption {
  id: number;
  name: string;
}

interface BatchForm {
  item_id: string;
  manufacture_date: string;
  expiry_date: string;
  initial_quantity: string;
  current_quantity: string;
  status: BatchStatus;
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "depleted", label: "Depleted" },
];

const STATUS_OPTIONS: { value: BatchStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "depleted", label: "Depleted" },
];

const MANAGE_ROLES: UserRole[] = ["admin", "manager", "ck_staff"];

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const toDisplayDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const getInitialForm = (batch?: BatchRecord | null): BatchForm => {
  if (!batch) {
    return {
      item_id: "",
      manufacture_date: "",
      expiry_date: "",
      initial_quantity: "",
      current_quantity: "",
      status: "active",
    };
  }

  return {
    item_id: String(batch.item_id),
    manufacture_date: toInputDate(batch.manufacture_date),
    expiry_date: toInputDate(batch.expiry_date),
    initial_quantity: String(batch.initial_quantity),
    current_quantity: String(batch.current_quantity),
    status: (batch.status as BatchStatus) ?? "active",
  };
};

export default function BatchesPage() {

  const [data, setData] = useState<BatchRecord[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [form, setForm] = useState<BatchForm>(getInitialForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = useAuthStore((state) => state.profile?.role ?? null);
  const router = useRouter();

  const canManage = role !== null && MANAGE_ROLES.includes(role);
  const isEditing = Boolean(editingBatch);

  const load = async () => {
    setLoading(true);
    try {
      const [batchResResult, productsResResult] = await Promise.allSettled([
        batchesApi.getBatches(),
        (async () => {
          const first = await productsApi.getAll({ page: 1, limit: 100 });
          let all = [...(first.data || [])];
          const totalPages = first.meta?.totalPages || 1;

          if (totalPages > 1) {
            const rest = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, idx) =>
                productsApi.getAll({ page: idx + 2, limit: 100 }),
              ),
            );
            all = all.concat(...rest.map((r) => r.data || []));
          }

          return all;
        })(),
      ]);

      if (batchResResult.status === "fulfilled") {
        setData(batchResResult.value);
      } else {
        setData([]);
      }

      if (productsResResult.status === "fulfilled") {
        setItems(
          productsResResult.value.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        );
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAddModal = () => {
    setEditingBatch(null);
    setForm(getInitialForm());
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (batch: BatchRecord) => {
    setEditingBatch(batch);
    setForm(getInitialForm(batch));
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.item_id) {
      setError("Item is required");
      return;
    }

    const initialQuantity = Number(form.initial_quantity);
    const currentQuantity = isEditing
      ? Number(form.current_quantity)
      : initialQuantity;

    if (!Number.isFinite(initialQuantity) || initialQuantity < 0) {
      setError("Initial quantity must be a non-negative number");
      return;
    }

    if (!Number.isFinite(currentQuantity) || currentQuantity < 0) {
      setError("Current quantity must be a non-negative number");
      return;
    }

    if (currentQuantity > initialQuantity) {
      setError("Current quantity cannot be greater than initial quantity");
      return;
    }

    const payload: CreateBatchPayload = {
      item_id: Number(form.item_id),
      manufacture_date: form.manufacture_date || undefined,
      expiry_date: form.expiry_date || undefined,
      initial_quantity: initialQuantity,
      current_quantity: currentQuantity,
      status: isEditing ? form.status : "active",
    };

    setSaving(true);
    try {
      if (editingBatch) {
        await batchesApi.updateBatch(editingBatch.id, payload);
      } else {
        await batchesApi.createBatch(payload);
      }

      setIsModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter((row) => {
    const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;

    const keyword = search.trim().toLowerCase();
    const searchMatch =
      !keyword ||
      row.batch_code.toLowerCase().includes(keyword) ||
      (row.items?.name || "").toLowerCase().includes(keyword);

    return statusMatch && searchMatch;
  });

  return (

    <div className="p-8 max-w-6xl mx-auto text-black">

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Batches</h1>
        {canManage && <Button onClick={openAddModal}>Add Batch</Button>}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batch code or item"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">Batch Code</th>
              <th className="text-left px-6 py-3">Item</th>
              <th className="text-left px-6 py-3">Manufacture</th>
              <th className="text-left px-6 py-3">Expiry</th>
              <th className="text-left px-6 py-3">Initial Qty</th>
              <th className="text-left px-6 py-3">Current Qty</th>
              <th className="text-left px-6 py-3">Status</th>
              {canManage && <th className="text-left px-6 py-3">Actions</th>}
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center py-6">
                  Loading batches...
                </td>
              </tr>
            )}

            {!loading && filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 8 : 7}
                  className="text-center py-6 text-gray-500"
                >
                  No batches found
                </td>
              </tr>
            )}

            {filteredData.map((b) => (

              <tr
                key={b.id}
                className="border-t hover:bg-gray-50 cursor-pointer transition"
                onClick={() => router.push(`/dashboard/batches/${b.id}`)}
              >
                <td className="px-6 py-3 font-medium">{b.batch_code}</td>
                <td className="px-6 py-3">{b.items?.name}</td>
                <td className="px-6 py-3">
                  {toDisplayDate(b.manufacture_date)}
                </td>
                <td className="px-6 py-3">
                  {toDisplayDate(b.expiry_date)}
                </td>
                <td className="px-6 py-3">{b.initial_quantity}</td>
                <td className="px-6 py-3 font-semibold">
                  {b.current_quantity}
                </td>
                <td className="px-6 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs uppercase tracking-wide">
                    {b.status || "-"}
                  </span>
                </td>
                {canManage && (
                  <td className="px-6 py-3">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(b);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                )}
              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBatch ? "Edit Batch" : "Add Batch"}
      >
        <form onSubmit={handleSave} className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {!editingBatch && (
            <p className="rounded bg-blue-50 p-2 text-sm text-blue-700">
              Batch code is auto-generated.
            </p>
          )}

          <Select
            label="Item"
            value={form.item_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, item_id: e.target.value }))
            }
            options={items.map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
            disabled={isEditing}
            required
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Manufacture Date"
              type="date"
              value={form.manufacture_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  manufacture_date: e.target.value,
                }))
              }
            />

            <Input
              label="Expiry Date"
              type="date"
              value={form.expiry_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, expiry_date: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Initial Quantity"
              type="number"
              min={0}
              value={form.initial_quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  initial_quantity: e.target.value,
                  current_quantity: isEditing
                    ? prev.current_quantity
                    : e.target.value,
                }))
              }
              disabled={isEditing}
              required
            />

            <Input
              label="Current Quantity"
              type="number"
              min={0}
              value={form.current_quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  current_quantity: e.target.value,
                }))
              }
              disabled
              required
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as BatchStatus,
              }))
            }
            options={STATUS_OPTIONS}
            disabled={!isEditing}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingBatch ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
