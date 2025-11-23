// src/api/employeeRoleApi.ts
import axiosClient from "./axiosClient";

export type EmployeeRoleItem = {
  employeeRoleId: number;
  name: string;
  isActive?: boolean;
};

export type EmployeeRoleListResponse = {
  data: EmployeeRoleItem[];
  pagination?: {
    currentPage?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
  };
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
};

const BASE = "/api/EmployeeRole";

export async function getEmployeeRoles(params?: Record<string, any>): Promise<EmployeeRoleListResponse> {
  const resp = await axiosClient.get<EmployeeRoleListResponse>(BASE, { params });
  return resp.data;
}

export async function getEmployeeRole(id: number): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.get<EmployeeRoleItem>(`${BASE}/${id}`);
  return resp.data;
}

export async function createEmployeeRole(payload: Partial<EmployeeRoleItem>): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.post<EmployeeRoleItem>(BASE, payload);
  return resp.data;
}

export async function updateEmployeeRole(id: number, payload: Partial<EmployeeRoleItem>): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.put<EmployeeRoleItem>(`${BASE}/${id}`, payload);
  return resp.data;
}

export async function deleteEmployeeRole(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}
