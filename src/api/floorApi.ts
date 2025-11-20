import axiosClient from "./axiosClient";

export type FloorItem = {
  floorCode: string;
  shelfCode: string;
  floorNumber: number;
  status?: string;
  isActive?: boolean;
  length?: number;
  width?: number;
  height?: number;
  maxWeight?: number;
  currentWeight?: number;
  maxContainers?: number;
  currentContainerCount?: number;
  utilizationRate?: number;
  imageUrl?: string | null;
};

export type FloorListResponse = {
  success?: boolean;
  data: FloorItem[];
  pagination?: any;
};


export async function getFloors(params?: Record<string, any>): Promise<FloorListResponse> {
  const resp = await axiosClient.get<FloorListResponse>("/api/Floor", { params });
  return resp.data;
}


export async function getFloor(floorCode: string): Promise<{ data: FloorItem } | FloorItem> {
  try {
    const resp = await axiosClient.get<{ data: FloorItem }>(`/api/Floor/${encodeURIComponent(floorCode)}`);
    return resp.data;
  } catch {
    const resp = await axiosClient.get<FloorListResponse>("/api/Floor", { params: { floorCode } });
    const body = resp.data as any;
    if (Array.isArray(body.data) && body.data.length > 0) return { data: body.data[0] };
    if (body.floorCode) return { data: body as FloorItem };
    throw new Error("Floor not found");
  }
}
