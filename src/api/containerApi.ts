import axiosClient from "./axiosClient";

export type ContainerItem = {
  positionx: number | null | undefined;
  positiony: number | null | undefined;
  positionz: number | null | undefined;
  containerCode: string;
  floorCode?: string; 
  isActive?: boolean;
  status?: string;
  maxWeight?: number;
  currentWeight?: number;
  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;
  imageUrl?: string; 
  type?: string; 
};

export type ContainerListResponse = {
  success?: boolean;
  data: ContainerItem[];
  pagination?: any;
};

export async function getContainers(params?: Record<string, any>): Promise<ContainerListResponse> {
  const resp = await axiosClient.get<ContainerListResponse>("/api/Container", { params });
  return resp.data;
}
