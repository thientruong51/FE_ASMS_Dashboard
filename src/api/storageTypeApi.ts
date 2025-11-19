import axiosClient from "./axiosClient";
import type { StorageType, ApiListResponse } from "../pages/storage-type/components/types";

const BASE = "/api/StorageType";

export async function getStorageTypes(params?: { page?: number; pageSize?: number; name?: string }): Promise<ApiListResponse<StorageType>> {
  const resp = await axiosClient.get<ApiListResponse<StorageType>>(BASE, { params });
  return resp.data;
}

export async function getStorageType(id: number): Promise<StorageType> {
  const resp = await axiosClient.get<StorageType>(`${BASE}/${id}`);
  return resp.data;
}

export async function createStorageType(payload: Partial<StorageType>): Promise<StorageType> {
  const resp = await axiosClient.post<StorageType>(BASE, payload);
  return resp.data;
}

export async function updateStorageType(id: number, payload: Partial<StorageType>): Promise<StorageType> {
  const resp = await axiosClient.put<StorageType>(`${BASE}/${id}`, payload);
  return resp.data;
}

export async function deleteStorageType(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}
