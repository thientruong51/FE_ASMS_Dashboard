import axiosClient from "./axiosClient";

export interface StorageRespItem {
  storageCode: string;
  buildingId: number;
  buildingCode: string;
  storageTypeId: number;
  storageTypeName: string;
  length?: number;
  width?: number;
  height?: number;
  status?: string;
  isActive?: boolean;
}

export interface StorageListResponse {
  data: StorageRespItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export async function getStorages(params?: Record<string, any>): Promise<StorageListResponse> {
  const resp = await axiosClient.get<StorageListResponse>("/api/Storage", { params });
  return resp.data;
}

export async function createStorage(payload: Partial<StorageRespItem>) {
  const resp = await axiosClient.post("/api/Storage", payload);
  return resp.data;
}
