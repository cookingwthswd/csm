import { api } from './client';
import {
    OrderResponse,
    CreateOrderDto,
    UpdateOrderStatusDto,
    OrderStatus,
    CreateOrderItemDto,
    OrderItemResponse,
    OrderResponseWithPagination
} from '@repo/types';

/**
 * Order API Service
 */
export const orderApi = {
    /**
     * Get all orders with optional filters
     */
    getAll: async (query?: { status?: OrderStatus; user_id?: number; page?: number; limit?: number }) => {
        const params = new URLSearchParams();
        if (query?.status) params.set('status', query.status);
        if (query?.user_id) params.set('user_id', String(query.user_id));
        if (query?.page) params.set('page', String(query.page));
        if (query?.limit) params.set('limit', String(query.limit));

        const queryString = params.toString();
        console.log('order api', await api.get<OrderResponseWithPagination>(`/orders${queryString ? `?${queryString}` : ''}`))
        return await api.get<OrderResponseWithPagination>(`/orders${queryString ? `?${queryString}` : ''}`);
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
        api.delete<{ success: boolean; message: string }>(`/orders/${id}`),

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
    }
};
