import { api } from './client';
import {
    OrderResponse,
    CreateOrderDto,
    UpdateOrderStatusDto,
    OrderStatus,
    CreateOrderItemDto,
    OrderItemResponse,
    OrderResponseWithPagination,
    OrderItemWithRemaining
} from '@repo/types';

/**
 * Order API Service
 */
export const orderApi = {
    /**
     * Get all orders with optional filters
     */
    getAll: async (query?: { status?: OrderStatus; search?: string; storeId?: number; sort?: 'asc' | 'desc'; page?: number; limit?: number }) => {
        const params = new URLSearchParams();
        if (query?.status) params.set('status', query.status);
        if (query?.search) params.set('search', query.search);
        if (query?.storeId) params.set('storeId', String(query.storeId));
        if (query?.sort) params.set('sort', query.sort);
        if (query?.page) params.set('page', String(query.page));
        if (query?.limit) params.set('limit', String(query.limit));

        const queryString = params.toString();
        return await api.get<OrderResponseWithPagination>(`/orders${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get all orders of a store
     */
    getAllByStoreId: async (query?: { status?: OrderStatus; search?: string; sort?: 'asc' | 'desc'; page?: number; limit?: number; storeId: number }) => {
        const params = new URLSearchParams();
        if (query?.status) params.set('status', query.status);
        if (query?.search) params.set('search', query.search);
        if (query?.sort) params.set('sort', query.sort);
        if (query?.page) params.set('page', String(query.page));
        if (query?.limit) params.set('limit', String(query.limit));

        const queryString = params.toString();
        return await api.get<OrderResponseWithPagination>(`/orders/store/${query?.storeId}${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get order by ID
     */
    getById: async (id: number) => await api.get<OrderResponse>(`/orders/${id}`),

    /**
     * Create new order
     */
    create: async (data: CreateOrderDto) => await api.post<OrderResponse>('/orders', data),

    /**
     * Update order status
     */
    updateStatus: (id: number, data: UpdateOrderStatusDto) =>
        api.put<OrderResponse>(`/orders/${id}/status`, data),

    /**
     * Cancel order
     */
    cancel: (id: number) =>
        api.put<{ success: boolean; message: string }>(`/orders/${id}/status`, { status: 'cancelled' }),

    /**
     * Add item to order
     */
    addItem: (orderId: number, data: CreateOrderItemDto) =>
        api.post<OrderItemResponse>(`/orders/${orderId}/items`, data),

    /**
     * Remove item from order
     */
    removeItem: (orderId: number, itemId: number) =>
        api.delete<{ success: boolean; message: string }>(`/orders/${orderId}/items/${itemId}`),

    update: async (orderId: number, data: CreateOrderDto) => {
        console.log(orderId, data)
        await api.put<OrderResponse>(`/orders/${orderId}`, data)
    },

    getOrderItemsWithRemaining: async (orderId: number) =>
  await api.get<OrderItemWithRemaining[]>(
    `/orders/${orderId}/items-with-remaining`
  ),

    /**
     * Confirm delivery - updates order and shipment to 'delivered'
     */
    confirmDelivery: async (orderId: number, data: { review?: string; rating?: number }) =>
        await api.post<OrderResponse>(`/orders/${orderId}/confirm-delivery`, data),

    /**
     * Add review to delivered order
     */
    addReview: async (orderId: number, data: { review: string; rating: number }) =>
        await api.post<OrderResponse>(`/orders/${orderId}/review`, data),
};
