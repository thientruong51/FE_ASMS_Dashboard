import axiosClient from "./axiosClient"; 
import type { Building, ApiListResponse, Pagination } from "../pages/building/components/types";

const BASE = "/api/Building";

function isHttpSuccess(status?: number) {
  return typeof status === "number" && status >= 200 && status < 300;
}

function extractData<T>(resp: any): T | null {
  if (resp?.data && typeof resp.data === "object" && "data" in resp.data) {
    return resp.data.data as T;
  }
  if (resp?.data && typeof resp.data === "object" && !("success" in resp.data)) {
    return resp.data as T;
  }
  if (resp && typeof resp === "object" && "data" in resp) {
    return resp.data as T;
  }
  return null;
}

export async function getBuildings(page = 1, pageSize = 10): Promise<{ data: Building[]; pagination?: Pagination | null }> {
  const resp = await axiosClient.get<ApiListResponse<Building>>(BASE, { params: { page, pageSize } });

  if (resp.data && typeof resp.data.success === "boolean" && resp.data.success === false) {
    throw new Error(resp.data.message ?? "Failed to get buildings");
  }

  const dataList = resp.data?.data ?? resp.data ?? [];
  const pagination = resp.data?.pagination ?? (resp.data && (resp as any).pagination) ?? null;

  return { data: dataList ?? [], pagination };
}

export async function getBuilding(id: number): Promise<Building> {
  const resp = await axiosClient.get(`${BASE}/${id}`);

  if (!isHttpSuccess(resp.status)) {
    throw new Error(resp.data?.message ?? `Failed to get building (status ${resp.status})`);
  }

  if (resp.data && typeof resp.data.success === "boolean" && resp.data.success === false) {
    throw new Error(resp.data.message ?? "Failed to get building");
  }

  const data = extractData<Building>(resp) ?? resp.data;
  if (!data) throw new Error("No building data returned");
  return data;
}

export async function createBuilding(payload: Partial<Building>): Promise<Building> {
  const resp = await axiosClient.post(BASE, payload);

  if (resp.data && typeof resp.data.success === "boolean" && resp.data.success === false) {
    throw new Error(resp.data.message ?? "Failed to create building");
  }

  if (!isHttpSuccess(resp.status)) {
    throw new Error(resp.data?.message ?? `Failed to create building (status ${resp.status})`);
  }

  const data = extractData<Building>(resp);
  if (data) return data;
  if (resp.status === 204) {
    throw new Error("Created but server returned no resource data");
  }
  return (resp.data as Building) ?? (resp as unknown as Building);
}

export async function updateBuilding(id: number, payload: Partial<Building>): Promise<Building> {
  const resp = await axiosClient.put(`${BASE}/${id}`, payload);

  if (resp.data && typeof resp.data.success === "boolean" && resp.data.success === false) {
    throw new Error(resp.data.message ?? "Failed to update building");
  }

  if (!isHttpSuccess(resp.status)) {
    throw new Error(resp.data?.message ?? `Failed to update building (status ${resp.status})`);
  }

  const data = extractData<Building>(resp);
  if (data) return data;
  return (resp.data as Building) ?? (resp as unknown as Building);
}

export async function deleteBuilding(id: number): Promise<void> {
  const resp = await axiosClient.delete(`${BASE}/${id}/delete`);

  if (!isHttpSuccess(resp.status)) {
    throw new Error(resp.data?.message ?? `Delete failed (status ${resp.status})`);
  }

  if (resp.data && typeof resp.data.success === "boolean" && resp.data.success === false) {
    throw new Error(resp.data.message ?? "Failed to delete building");
  }

  return;
}
