import { useState } from "react";
import type { CreateTransactionDto, TransactionType } from "@repo/types";
import { TRANSACTION_TYPE_VALUES } from "@repo/types";

interface Props {
  onSubmit: (data: CreateTransactionDto) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export function TransactionForm({ onSubmit, onCancel, submitting }: Props) {
  const [form, setForm] = useState<CreateTransactionDto>({
    storeId: 0,
    itemId: 0,
    batchId: undefined,
    quantityChange: 0,
    type: TRANSACTION_TYPE_VALUES[0] as TransactionType,
    referenceType: undefined,
    referenceId: undefined,
    note: undefined,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm(
      (prev) =>
        ({
          ...prev,
          [name]:
            value === ""
              ? undefined
              : isNaN(Number(value))
                ? value
                : Number(value),
        }) as any,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-bold">New Transaction</h2>
        <div className="mb-2">
          <label className="block text-sm font-medium">Store ID</label>
          <input
            type="number"
            name="storeId"
            value={form.storeId}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Item ID</label>
          <input
            type="number"
            name="itemId"
            value={form.itemId}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Batch ID</label>
          <input
            type="number"
            name="batchId"
            value={form.batchId || ""}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Quantity Change</label>
          <input
            type="number"
            name="quantityChange"
            value={form.quantityChange}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          >
            {TRANSACTION_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Reference Type</label>
          <input
            type="text"
            name="referenceType"
            value={form.referenceType || ""}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Reference ID</label>
          <input
            type="number"
            name="referenceId"
            value={form.referenceId || ""}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Note</label>
          <input
            type="text"
            name="note"
            value={form.note || ""}
            onChange={handleChange}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
