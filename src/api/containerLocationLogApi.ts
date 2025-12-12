// src/api/containerLocationLogApi.ts
import axiosClient from "./axiosClient";

export type ContainerLocationLogItem = {
  containerLocationLogId: number;
  containerCode: string | null;
  orderCode?: string | null;
  performedBy?: string | null;
  updatedDate?: string | null;
  oldFloor?: string | null;
  currentFloor?: string | null;
  reason?: string | null;
  algorithm?: string | null;
  notes?: string | null;
  orderDetailId?: number | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export const containerLocationLogApi = {
  // GET pagination
  getLogs: (params?: Record<string, any>) =>
    axiosClient.get<PaginatedResponse<ContainerLocationLogItem>>(
      "/api/ContainerLocationLog",
      { params }
    ),

  getLogById: (id: number | string) =>
    axiosClient.get<ContainerLocationLogItem>(`/api/ContainerLocationLog/${id}`),

  createLog: (payload: Partial<ContainerLocationLogItem>) =>
    axiosClient.post("/api/ContainerLocationLog", payload),

  updateLog: (id: number | string, payload: Partial<ContainerLocationLogItem>) =>
    axiosClient.put(`/api/ContainerLocationLog/${id}`, payload),

  deleteLog: (id: number | string) =>
    axiosClient.delete(`/api/ContainerLocationLog/${id}`),

  // GET by containerCode (cũng có pagination)
  getByContainerCode: (
    containerCode: string,
    pageNumber = 1,
    pageSize = 10
  ) =>
    axiosClient.get<PaginatedResponse<ContainerLocationLogItem>>(
      "/api/ContainerLocationLog",
      {
        params: { containerCode, pageNumber, pageSize },
      }
    ),
};

export default containerLocationLogApi;
