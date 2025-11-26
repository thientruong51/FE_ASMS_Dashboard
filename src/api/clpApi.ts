import axiosClient from "./axiosClient";


export interface CLPFindRequest {
  productTypeId?: number;       
  productTypeIds?: number[];    
  packageLength: number;         
  packageWidth: number;
  packageHeight: number;
  packageWeight: number;         
  storageDays: number;
  isFragile?: boolean;
  [key: string]: any;
}


export interface SuitableContainerItem {
  containerCode?: string;
  containerTypeId?: number;
  availableQuantity?: number;
  fitScore?: number;        
  dimensions?: { length?: number; width?: number; height?: number };
  maxWeight?: number;
  [key: string]: any;
}


export interface CLPFindResponse {
  success?: boolean;
  message?: string;
  data: SuitableContainerItem[];
}


export interface PlaceContainerRequest {
  containerCode: string;
  floorCode: string;
  layer: number;              
  serialNumber: number;        
  productTypeId: number;
  requiresRearrangement?: boolean;
  rearrangeContainerCode?: string | null;
  orderDetailId?: number;
  [key: string]: any;
}


export interface PlaceContainerResponse {
  success: boolean;
  message?: string;
  data?: any; 
}


export async function findSuitableContainers(
  payload: CLPFindRequest
): Promise<CLPFindResponse> {
  const resp = await axiosClient.post<CLPFindResponse>(
    "/api/CLP/find-suitable-containers",
    payload
  );
  return resp.data;
}


export async function placeContainer(
  payload: PlaceContainerRequest
): Promise<PlaceContainerResponse> {
  const resp = await axiosClient.post<PlaceContainerResponse>(
    "/api/Container/place",
    payload
  );
  return resp.data;
}

export default {
  findSuitableContainers,
  placeContainer,

};
