import axiosClient from "./axiosClient";

export type ContainerItem = {
  containerCode: string;

  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;

  positionx?: number | null;
  positiony?: number | null;
  positionz?: number | null;

  floorCode?: string;

  isActive?: boolean;
  status?: string;

  price?: number;
  maxWeight?: number;
  currentWeight?: number;

  productTypeId?: number;

  imageUrl?: string | null;
  notes?: string | null;

  type?: string; 
  serialNumber?: number; 
  layer?: number;

  containerAboveCode?: string | null;

  lastOptimizedDate?: string | null;
  optimizationScore?: number;

  orderDetailId?: number | null;
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
export async function updateContainerPosition(
  containerCode: string,
  params: { serialNumber?: number | null; layer?: number | null }
): Promise<void> {

  await axiosClient.patch(`/api/Container/${encodeURIComponent(containerCode)}/position`, null, {
    params: {
      ...(params.serialNumber !== undefined ? { serialNumber: params.serialNumber } : {}),
      ...(params.layer !== undefined ? { layer: params.layer } : {}),
    },
  });
}
