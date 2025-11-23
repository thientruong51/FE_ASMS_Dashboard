import axiosClient from "./axiosClient";

export interface Service {
  serviceId: number;
  name: string;
  price: number;
  description?: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

const BASE = "/api/Service";

export async function getServices(): Promise<Service[]> {
  const resp = await axiosClient.get<ApiListResponse<Service>>(BASE);
  return resp.data?.data ?? [];
}

export async function getService(id: number): Promise<Service> {
  const resp = await axiosClient.get<Service>(`${BASE}/${id}`);
  return resp.data;
}

export async function createService(payload: Partial<Service>): Promise<Service> {
  const resp = await axiosClient.post<Service>(BASE, payload);
  return resp.data;
}

export async function updateService(id: number, payload: Partial<Service>): Promise<Service> {
  const resp = await axiosClient.put<Service>(`${BASE}/${id}`, payload);
  return resp.data;
}

export async function deleteService(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}
