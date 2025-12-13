import axiosClient from "./axiosClient";

type EmployeeRoleApiItem = {
  employeeRoleId: number;
  name: string;
  isActive?: boolean;
};

export type EmployeeRoleItem = {
  employeeRoleId: number;
  roleName: string;
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
};

const BASE = "/api/EmployeeRole";

export async function getEmployeeRoles(
  params?: Record<string, any>
): Promise<EmployeeRoleListResponse> {
  const resp = await axiosClient.get<{
    data: EmployeeRoleApiItem[];
    pagination?: any;
  }>(BASE, { params });

  return {
    ...resp.data,
    data: resp.data.data.map(mapApiToItem),
  };
}

export async function getEmployeeRole(
  id: number
): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.get<EmployeeRoleApiItem>(
    `${BASE}/${id}`
  );
  return mapApiToItem(resp.data);
}

export async function createEmployeeRole(
  payload: Pick<EmployeeRoleItem, "roleName" | "isActive">
): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.post<EmployeeRoleApiItem>(BASE, {
    name: payload.roleName, 
    isActive: payload.isActive,
  });
  return mapApiToItem(resp.data);
}

export async function updateEmployeeRole(
  id: number,
  payload: Pick<EmployeeRoleItem, "roleName" | "isActive">
): Promise<EmployeeRoleItem> {
  const resp = await axiosClient.put<EmployeeRoleApiItem>(
    `${BASE}/${id}`,
    {
      roleName: payload.roleName,
      isActive: payload.isActive,
    }
  );
  return mapApiToItem(resp.data);
}

export async function deleteEmployeeRole(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}

function mapApiToItem(api: EmployeeRoleApiItem): EmployeeRoleItem {
  return {
    employeeRoleId: api.employeeRoleId,
    roleName: api.name,
    isActive: api.isActive,
  };
}
