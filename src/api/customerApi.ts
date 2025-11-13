import axiosClient from "./axiosClient";

export const customerApi = {
  getCustomers: (params?: Record<string, any>) =>
    axiosClient.get("/api/Customer", { params }),

  getCustomerById: (id: number | string) =>
    axiosClient.get(`/api/Customer/${id}`),

  createCustomer: (payload: any) =>
    axiosClient.post("/api/Customer", payload),

  updateCustomer: (id: number | string, payload: any) =>
    axiosClient.put(`/api/Customer/${id}`, payload),

  deleteCustomer: (id: number | string) =>
    axiosClient.put(`/api/Customer/${id}/delete`),
};

export default customerApi;
