import axiosClient from "./axiosClient"; 
import type { ContainerType } from "../pages/container-type/components/types";

const BASE = "/api/ContainerType";

export async function getContainerTypes(): Promise<ContainerType[]> {
  const resp = await axiosClient.get<ContainerType[]>(BASE);
  return resp.data; 
}

export async function getContainerType(id: number): Promise<ContainerType> {
  const resp = await axiosClient.get<ContainerType>(`${BASE}/${id}`);
  return resp.data;
}

export async function createContainerType(payload: Partial<ContainerType>): Promise<ContainerType> {
  const resp = await axiosClient.post<ContainerType>(BASE, payload);
  return resp.data;
}

export async function updateContainerType(id: number, payload: Partial<ContainerType>): Promise<ContainerType> {
  const resp = await axiosClient.put<ContainerType>(`${BASE}/${id}`, payload);
  return resp.data;
}

export async function deleteContainerType(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}
