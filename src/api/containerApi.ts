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
export type RemoveContainerPayload = {
  containerCode: string;
  performedBy: string;
  orderCode?: string | null;
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


export async function getContainer(containerCode: string): Promise<ContainerItem | null> {
  try {
    const resp = await axiosClient.get(`/api/Container/${encodeURIComponent(containerCode)}`);
    return (resp.data?.data ?? resp.data) ?? null;
  } catch (err) {
    console.warn("getContainer failed", err);
    return null;
  }
}


export async function createContainer(payload: Partial<ContainerItem>): Promise<ContainerItem | null> {
  try {
    const resp = await axiosClient.post("/api/Container", payload);
    return (resp.data?.data ?? resp.data) ?? null;
  } catch (err) {
    console.error("createContainer failed", err);
    throw err;
  }
}


export async function updateContainer(
  containerCode: string,
  payload: Partial<ContainerItem>
): Promise<ContainerItem | null> {
  try {
    const resp = await axiosClient.put(`/api/Container/${encodeURIComponent(containerCode)}`, payload);
    return (resp.data?.data ?? resp.data) ?? null;
  } catch (err) {
    console.error("updateContainer failed", err);
    throw err;
  }
}


export async function deleteContainer(containerCode: string): Promise<void> {
  try {
    await axiosClient.delete(`/api/Container/${encodeURIComponent(containerCode)}`);
  } catch (err) {
    console.error("deleteContainer failed", err);
    throw err;
  }
}

export async function removeContainer(payload: RemoveContainerPayload): Promise<void> {
  try {
    await axiosClient.post("/api/Container/remove", {
      containerCode: payload.containerCode,
      performedBy: payload.performedBy,
      ...(payload.orderCode ? { orderCode: payload.orderCode } : {}),
    });
  } catch (err) {
    console.error("removeContainer failed", err);
    throw err;
  }
}
