import axiosClient from "./axiosClient";

export type ApiResponse<T = any> = {
  success?: boolean;
  data?: T;
  errorMessage?: string | null;
};

const BASE = "/api/OrderDetail";


export async function getOrderDetail(id: number): Promise<ApiResponse<any>> {
  const resp = await axiosClient.get<ApiResponse<any>>(`${BASE}/${id}`);
  return resp.data ?? resp;
}

export async function updateOrderDetail(
  id: number,
  payload: Record<string, any>
): Promise<ApiResponse<any>> {
  const resp = await axiosClient.put<ApiResponse<any>>(`${BASE}/${id}`, payload);
  return resp.data ?? resp;
}


export async function createOrderDetail(payload: Record<string, any>): Promise<ApiResponse<any>> {
  const resp = await axiosClient.post<ApiResponse<any>>(BASE, payload);
  return resp.data ?? resp;
}


export async function deleteOrderDetail(id: number): Promise<ApiResponse<void>> {
  const resp = await axiosClient.delete<ApiResponse<void>>(`${BASE}/${id}`);
  return resp.data ?? resp;
}


export async function listOrderDetails(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
  const resp = await axiosClient.get<ApiResponse<any[]>>(BASE, { params });
  return resp.data ?? resp;
}

const orderDetailApi = {
  getOrderDetail,
  updateOrderDetail,
  createOrderDetail,
  deleteOrderDetail,
  listOrderDetails,
};

export default orderDetailApi;
