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

/**
 * Lấy danh sách kệ (có params tùy chọn)
 */
export async function getShelves(params?: Record<string, any>): Promise<ShelfListResponse> {
  const resp = await axiosClient.get<ShelfListResponse>("/api/Shelf", { params });
  return resp.data;
}

/**
 * Lấy chi tiết 1 kệ theo shelfCode.
 * Nếu endpoint GET /api/Shelf/{shelfCode} không tồn tại, sẽ fallback sang query /api/Shelf?shelfCode=...
 */
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

/**
 * Thêm kệ mới
 * @param payload dữ liệu ShelfItem (API ví dụ nhận body giống type ShelfItem)
 * @returns response.data từ API (định dạng tuỳ backend, ở đây giả sử trả về { data: ShelfItem } )
 */
export async function addShelf(payload: ShelfItem): Promise<ShelfDetailResponse> {
  const resp = await axiosClient.post<ShelfDetailResponse>("/api/Shelf", payload);
  return resp.data;
}

/**
 * Xoá kệ theo shelfCode
 * @param shelfCode mã kệ cần xoá
 * @returns nếu API trả body thì trả về resp.data, ngược lại trả về void
 */
export async function deleteShelf(shelfCode: string): Promise<any> {
  const resp = await axiosClient.delete(`/api/Shelf/${encodeURIComponent(shelfCode)}`);
  return resp.data;
}
