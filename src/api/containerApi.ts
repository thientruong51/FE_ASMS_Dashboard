// src/apis/containerApi.ts
import axiosClient from "./axiosClient";

export type ContainerItem = {
  positionx: number | null | undefined;
  positiony: number | null | undefined;
  positionz: number | null | undefined;
  containerCode: string;
  floorCode?: string; // e.g. "BLD001-STR001-SH001-F1"
  isActive?: boolean;
  status?: string;
  maxWeight?: number;
  currentWeight?: number;
  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;
  imageUrl?: string; // might be glb or image url
  type?: string; // "A" | "B" | ...
  // other fields...
};

export type ContainerListResponse = {
  success?: boolean;
  data: ContainerItem[];
  pagination?: any;
};

/** Lấy container trong 1 shelf (paging) */
export async function getContainers(params?: Record<string, any>): Promise<ContainerListResponse> {
  const resp = await axiosClient.get<ContainerListResponse>("/api/Container", { params });
  return resp.data;
}
