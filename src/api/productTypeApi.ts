import axiosClient from "./axiosClient";

export type ProductTypeItem = {
  productTypeId: number;
  name: string;
  status?: string;
  isActive?: boolean;
  isFragile?: boolean;
  canStack?: boolean;
  description?: string | null;
};

export type ProductTypeListResponse = {
  data: ProductTypeItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
};

const BASE = "/api/ProductType";

export async function getProductTypes(params?: Record<string, any>): Promise<ProductTypeListResponse> {
  const resp = await axiosClient.get<ProductTypeListResponse>(BASE, { params });
  return resp.data;
}

export async function getProductType(id: number): Promise<ProductTypeItem> {
  const resp = await axiosClient.get<ProductTypeItem>(`${BASE}/${id}`);
  return resp.data;
}

export async function createProductType(payload: Partial<ProductTypeItem>): Promise<ProductTypeItem> {
  const resp = await axiosClient.post<ProductTypeItem>(BASE, payload);
  return resp.data;
}

export async function updateProductType(id: number, payload: Partial<ProductTypeItem>): Promise<ProductTypeItem> {
  const resp = await axiosClient.put<ProductTypeItem>(`${BASE}/${id}`, payload);
  return resp.data;
}

export async function deleteProductType(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}/delete`);
}
