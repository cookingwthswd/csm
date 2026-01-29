"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/api/orders";
import { Button } from "@/components/ui";
import { OrderFormModal } from "./components/order-form-modal";
import { ConfirmationModal } from "./components/confirmation-modal";
import type { OrderResponseWithPagination, CreateOrderDto, OrderStatus, OrderResponse, Pagination } from "@repo/types";
import { ORDER_STATUS, ORDER_STATUS_VALUES, statusColors } from "@repo/types"
import { OrderDetailsModal } from "./components/order-details-modal";
import { AddOrderModal } from "./components/create-order-modal";
import { UpdateOrderModal } from "./components/update-order-model";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<OrderResponse[]>()
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [paginationData, setPaginationData] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Query for fetching orders
  const {
    data,
    isLoading,
    error,
  } = useQuery<OrderResponseWithPagination>({
    queryKey: ["orders", currentPage, pageSize],
    queryFn: () => orderApi.getAll({ page: currentPage, limit: pageSize }),
  });

  useEffect(() => {
    if (data && !isLoading) {
      setOrders(data.data)
      setPaginationData(data.meta)
    }
  }, [data]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setIsFormOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: OrderStatus } }) =>
      orderApi.updateStatus(id, data),

    onSuccess: (_data, variables) => {
      console.log(variables)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: orderApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDeleteId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateOrderDto }) =>
      orderApi.update(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditingOrder(null);
    },
  });


  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);

  const handleFormSubmit = (data: CreateOrderDto) => {
    createMutation.mutate(data);
  };

  const handleStatusUpdate = (orderId: number, status: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, data: { status } });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };

  const getStatusBadge = (status: OrderStatus) => {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[status]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const generatePageNumbers = () => {
    if (!paginationData) return [];

    const { page, totalPages } = paginationData;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      // Show pages around current page
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) return <div className="text-gray-500">Loading orders...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Orders</h1>
        <Button
          onClick={() => {
            setEditingOrder(null);
            setIsFormOpen(true);
          }}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Creating..." : "Add Order"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-600">
          {error instanceof Error ? error.message : "Failed to load orders"}
        </div>
      )}

      {/* Page Size Selector */}
      <div className="mt-4 flex items-center gap-2">
        <label className="text-sm text-gray-700">Show:</label>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-900"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700">entries</span>
        {paginationData && (
          <span className="ml-auto text-sm text-gray-600">
            Showing {((paginationData.page - 1) * paginationData.limit) + 1} to{" "}
            {Math.min(paginationData.page * paginationData.limit, paginationData.total)} of{" "}
            {paginationData.total} entries
          </span>
        )}
      </div>

      <div className="mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-black">
              <th className="p-3 font-medium">Order #</th>
              <th className="p-3 font-medium">Store</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Created By</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders && !isLoading && orders.map((order, i) => (
              <tr key={order.id} className="border-b hover:bg-gray-50 text-black">
                <td className="p-3 font-medium">
                  {order.id}
                </td>
                <td className="p-3">
                  {order.storeName || `Store ${order.storeId}`}
                </td>
                <td className="p-3">{getStatusBadge(order.status as OrderStatus)}</td>
                <td className="p-3">
                  {order.totalAmount?.toFixed(2) || "0.00"} VNĐ
                </td>
                <td className="p-3">
                  {new Date(order.createdAt).toLocaleDateString('vi-vn')}
                </td>
                <td className="p-3">
                  {order.createdBy} ({order.creatorRole})
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setDetailOrderId(order.id)}
                    >
                      Details
                    </Button>
                    <select
                      value={order.status as OrderStatus}
                      onChange={(e) =>
                        handleStatusUpdate(order.id, e.target.value as OrderStatus)
                      }
                      disabled={updateStatusMutation.isPending}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      {ORDER_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {order.status === ORDER_STATUS.PENDING && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingOrder(order);
                        }}
                      >
                        Edit
                      </Button>
                    )}

                    {order.status === ORDER_STATUS.PENDING && (
                      <button
                        onClick={() => setApproveId(order.id)}
                        className="text-green-600 hover:text-green-800"
                        disabled={deleteMutation.isPending}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(order.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders?.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {paginationData && paginationData.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Page {paginationData.page} of {paginationData.totalPages}
          </div>

          <div className="flex items-center gap-2">
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={paginationData.page === 1}
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ««
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(paginationData.page - 1)}
              disabled={paginationData.page === 1}
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              «
            </button>

            {/* Page Numbers */}
            {generatePageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...' || page === paginationData.page}
                className={`rounded border px-3 py-1 text-sm ${page === paginationData.page
                  ? 'bg-blue-600 text-white'
                  : page === '...'
                    ? 'cursor-default border-transparent'
                    : 'text-gray-700 hover:bg-gray-100'
                  } disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            ))}

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(paginationData.page + 1)}
              disabled={paginationData.page === paginationData.totalPages}
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              »
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(paginationData.totalPages)}
              disabled={paginationData.page === paginationData.totalPages}
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        action="cancel"
      />
      {approveId && (
        <ConfirmationModal
          isOpen={approveId !== null}
          onClose={() => setApproveId(null)}
          onConfirm={() => {
            handleStatusUpdate(approveId, 'approved')
            setApproveId(null)
          }}
          isLoading={deleteMutation.isPending}
          title="Approve Order"
          message="Are you sure you want to approve this order?"
          action="approve"
        />
      )}
      <OrderDetailsModal
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
      />
      <AddOrderModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
      <UpdateOrderModal
        isOpen={!!editingOrder}
        order={editingOrder}
        onClose={() => {
          setEditingOrder(null);
          setIsFormOpen(false);
        }}
        onSubmit={(id, data) =>
          updateMutation.mutate({ id, data })
        }
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}