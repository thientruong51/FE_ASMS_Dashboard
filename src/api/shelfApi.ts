// src/apis/shelfApi.ts
import axiosClient from "./axiosClient";

export type ShelfItem = {
  shelfCode: string;
  storageCode: string;
  status?: string;
  isActive?: boolean;
  length?: number;
  width?: number;
  height?: number;
  imageUrl?: string; // server returns .glb or image URL here
  // other fields...
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
    // try path param first
    const resp = await axiosClient.get<ShelfDetailResponse>(`/api/Shelf/${encodeURIComponent(shelfCode)}`);
    return resp.data;
  } catch {
    // fallback to query param
    const resp = await axiosClient.get<ShelfListResponse>("/api/Shelf", { params: { shelfCode } });
    // backend sometimes returns { data: [...] } — return first item or data as object
    if (resp.data) {
      // if resp.data.data exists, return that
      const body = resp.data as any;
      if (Array.isArray(body.data) && body.data.length > 0) {
        return { data: body.data[0] };
      }
      if (body.shelfCode) {
        return { data: body as any };
      }
    }
    // if nothing, throw
    throw new Error("Shelf not found");
  }
}
