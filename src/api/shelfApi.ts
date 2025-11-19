import axiosClient from "./axiosClient";

export const shelfApi = {
  getShelfTypes: (params?: Record<string, any>) => axiosClient.get("/api/ShelfType", { params }),
  getShelfById: (id: number) => axiosClient.get(`/api/ShelfType/${id}`),
  createShelf: (payload: any) => axiosClient.post("/api/ShelfType", payload),
  updateShelf: (id: number, payload: any) => axiosClient.put(`/api/ShelfType/${id}`, payload),
  deleteShelf: (id: number) => axiosClient.delete(`/api/ShelfType/${id}`),
};

export default shelfApi;
