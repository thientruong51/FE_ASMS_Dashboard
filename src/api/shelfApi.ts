import axiosClient from "./axiosClient";

export type ShelfItem = {
  shelfCode: string;
  storageCode: string;
  status?: string;
  isActive?: boolean;
  length?: number;
  width?: number;
  height?: number;
  imageUrl?: string; 
};

export type ShelfListResponse = {
  success?: boolean;
  data: ShelfItem[];
  pagination?: any;
};

export type ShelfDetailResponse = {
  data: ShelfItem;
};

export async function getShelves(params?: Record<string, any>): Promise<ShelfListResponse> {
  const resp = await axiosClient.get<ShelfListResponse>("/api/Shelf", { params });
  return resp.data;
}

export async function getShelf(shelfCode: string): Promise<ShelfDetailResponse | ShelfItem> {
  try {
    const resp = await axiosClient.get<ShelfDetailResponse>(`/api/Shelf/${encodeURIComponent(shelfCode)}`);
    return resp.data;
  } catch {
    const resp = await axiosClient.get<ShelfListResponse>("/api/Shelf", { params: { shelfCode } });
    if (resp.data) {
      const body = resp.data as any;
      if (Array.isArray(body.data) && body.data.length > 0) {
        return { data: body.data[0] };
      }
      if (body.shelfCode) {
        return { data: body as any };
      }
    }
    throw new Error("Shelf not found");
  }
}
