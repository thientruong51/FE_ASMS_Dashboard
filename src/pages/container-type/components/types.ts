export interface ContainerType {
  containerTypeId: number; 
  type: string;
  length: number;
  width: number;
  height: number;
  imageUrl?: string | null;
  price?: number;
}

export interface ApiListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}
