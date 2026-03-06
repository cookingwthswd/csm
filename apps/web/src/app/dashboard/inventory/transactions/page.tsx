"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import { TransactionTable } from "../components/transaction-table";
import { TransactionForm } from "../components/transaction-form";
import type { TransactionResponse, CreateTransactionDto } from "@repo/types";

export default function InventoryTransactionsPage() {
  const queryClient = useQueryClient();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<TransactionResponse[]>({
    queryKey: ["inventoryTransactions"],
    queryFn: () => inventoryApi.getTransactions(),
  });

  useEffect(() => {
    if (data && !isLoading) {
      setTransactions(data);
    }
    if (isError && queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [data, isLoading, isError, queryError]);

  const createMutation = useMutation<
    TransactionResponse,
    any,
    CreateTransactionDto
  >({
    mutationFn: inventoryApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryTransactions"] });
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      if (err instanceof Error) setError(err.message);
    },
  });

  const handleSubmit = (dto: CreateTransactionDto) => {
    createMutation.mutate(dto);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Transactions</h1>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setIsFormOpen(true)}
        >
          Add Transaction
        </button>
      </div>

      {isLoading && <div className="text-gray-500">Loading...</div>}
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      {!isLoading && transactions && <TransactionTable data={transactions} />}

      {isFormOpen && (
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          submitting={createMutation.isPending}
        />
      )}
    </div>
  );
}
