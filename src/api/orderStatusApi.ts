import axiosClient from "./axiosClient";

export type ApiResponse<T = any> = {
  success?: boolean;
  data?: T;
  errorMessage?: string | null;
};

const BASE = "/api/OrderStatus";

export async function checkOverdue(): Promise<ApiResponse<void>> {
  const resp = await axiosClient.post<ApiResponse<void>>(`${BASE}/check-overdue`);
  return resp.data ?? resp;
}

export async function updateStatus(orderCode: string): Promise<ApiResponse<void>> {
  const resp = await axiosClient.post<ApiResponse<void>>(`${BASE}/${encodeURIComponent(orderCode)}/update-status`);
  return resp.data ?? resp;
}

/**
 * Gọi API gia hạn đơn hàng.
 * Nếu unpaidAmount được truyền (số), sẽ được gửi kèm như query param `unpaidAmount`.
 */
export async function extendOrder(orderCode: string, newReturnDate: string, unpaidAmount?: number): Promise<ApiResponse<void>> {
  const params: Record<string, any> = { newReturnDate };
  if (unpaidAmount !== undefined && unpaidAmount !== null) {
    params.unpaidAmount = unpaidAmount;
  }

  const resp = await axiosClient.post<ApiResponse<void>>(
    `${BASE}/${encodeURIComponent(orderCode)}/extend`,
    null,
    { params }
  );
  return resp.data ?? resp;
}

export async function moveToExpiredStorage(orderCode: string): Promise<ApiResponse<void>> {
  const resp = await axiosClient.post<ApiResponse<void>>(
    `${BASE}/${encodeURIComponent(orderCode)}/move-to-expired-storage`
  );
  return resp.data ?? resp;
}

export async function togglePayment(orderCode: string): Promise<ApiResponse<void>> {
  const resp = await axiosClient.post<ApiResponse<void>>(`${BASE}/${encodeURIComponent(orderCode)}/toggle-payment`);
  return resp.data ?? resp;
}

export type OrderStatusInfo = {
  orderCode?: string;
  status?: string;
  paymentStatus?: string;
  style?: string;
  returnDate?: string | null;
  depositDate?: string | null;
  totalPrice?: number | null;
  currentAssignedEmployee?: string | null;
  buildingCode?: string | null;
  message?: string | null;
};

export async function getOrderStatus(orderCode: string): Promise<ApiResponse<OrderStatusInfo>> {
  const resp = await axiosClient.get<ApiResponse<OrderStatusInfo>>(`${BASE}/${encodeURIComponent(orderCode)}/status`);
  return resp.data ?? resp;
}

const orderStatusApi = {
  checkOverdue,
  updateStatus,
  extendOrder,
  moveToExpiredStorage,
  togglePayment,
  getOrderStatus,
};

export default orderStatusApi;
