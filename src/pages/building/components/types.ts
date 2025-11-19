export type Building = {
  buildingId: number;
  buildingCode?: string;
  name: string;
  area?: string | number | null;
  address?: string | null;
  status?: string | null;
  isActive?: boolean;
  imageUrl?: string | null;
};

export type Pagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export type ApiListResponse<T> = {
  message: string;
  success: boolean;
  data: T[];
  pagination?: Pagination;
};
