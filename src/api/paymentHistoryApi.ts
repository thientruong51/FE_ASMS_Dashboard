import axiosClient from "./axiosClient";

export interface PaymentHistoryItem {
  paymentHistoryCode: string;
  orderCode?: string | null;
  paymentMethod?: string | null;
  paymentPlatform?: string | null;
  amount?: number | null;
}


export interface PaymentHistoryListResponse {
  data: PaymentHistoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}


export interface PaymentHistoryPayload {
  orderCode?: string | null;
  paymentMethod?: string | null;
  paymentPlatform?: string | null;
  amount?: number | null;
}

export async function getPaymentHistories(params?: Record<string, any>): Promise<PaymentHistoryListResponse> {
  const resp = await axiosClient.get<PaymentHistoryListResponse>("/api/PaymentHistory", { params });
  return resp.data;
}


export async function createPaymentHistory(payload: PaymentHistoryPayload): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.post<PaymentHistoryItem>("/api/PaymentHistory", payload);
  return resp.data;
}


export async function getPaymentHistory(code: string): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.get<PaymentHistoryItem>(`/api/PaymentHistory/${encodeURIComponent(code)}`);
  return resp.data;
}


export async function updatePaymentHistory(code: string, payload: PaymentHistoryPayload): Promise<PaymentHistoryItem> {
  const resp = await axiosClient.put<PaymentHistoryItem>(`/api/PaymentHistory/${encodeURIComponent(code)}`, payload);
  return resp.data;
}


export async function deletePaymentHistory(code: string): Promise<void> {
  await axiosClient.delete(`/api/PaymentHistory/${encodeURIComponent(code)}`);
}
