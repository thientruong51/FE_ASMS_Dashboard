export interface StorageType {
  storageTypeId: number;
  name: string;
  length: number;
  width: number;
  height: number;
  totalVolume?: number | null;
  area?: number | null;
  price?: number | null;
  imageUrl?: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
