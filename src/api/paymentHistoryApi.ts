// src/api/paymentHistoryApi.ts
import axiosClient from "./axiosClient";

/**
 * Payment history item returned by backend
 */
export interface PaymentHistoryItem {
  paymentHistoryCode: string;
  orderCode?: string | null;
  paymentMethod?: string | null;
  paymentPlatform?: string | null;
  amount?: number | null;
  // nếu backend có thêm trường như createdAt, status... bạn có thể bổ sung ở đây
}

/**
 * List (array) response - adjust if backend wraps in { data: [...] }
 */
export interface PaymentHistoryListResponse {
  data: PaymentHistoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

/**
 * Payload used to create/update a payment history
 */
export interface PaymentHistoryPayload {
  orderCode?: string | null;
  paymentMethod?: string | null;
  paymentPlatform?: string | null;
  amount?: number | null;
}

/**
 * Get payment histories (supports query params for paging / filtering)
 * Example params: { page: 1, pageSize: 10, orderCode: '20251127-0004' }
 */
export async function getPaymentHistories(params?: Record<string, any>): Promise<PaymentHistoryListResponse> {
  const resp = await axiosClient.get<PaymentHistoryListResponse>("/api/PaymentHistory", { params });
  return resp.data;
}

/**
 * Create a new payment history
 */
export async function createPaymentHistory(payload: PaymentHistoryPayload): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.post<PaymentHistoryItem>("/api/PaymentHistory", payload);
  return resp.data;
}

/**
 * Get payment history by code (GET /api/PaymentHistory/{code})
 */
export async function getPaymentHistory(code: string): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.get<PaymentHistoryItem>(`/api/PaymentHistory/${encodeURIComponent(code)}`);
  return resp.data;
}

/**
 * Update payment history by code (PUT /api/PaymentHistory/{code})
 */
export async function updatePaymentHistory(code: string, payload: PaymentHistoryPayload): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.put<PaymentHistoryItem>(`/api/PaymentHistory/${encodeURIComponent(code)}`, payload);
  return resp.data;
}

/**
 * Delete payment history by code
 */
export async function deletePaymentHistory(code: string): Promise<void> {
  await axiosClient.delete(`/api/PaymentHistory/${encodeURIComponent(code)}`);
}
