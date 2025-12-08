import axiosClient from "./axiosClient";

export const customerApi = {
  getCustomers: (params?: Record<string, any>) =>
    axiosClient.get("/api/Customer", { params }),

  getCustomerById: (id: number | string) =>
    axiosClient.get(`/api/Customer/${id}`),

  createCustomer: (payload: any) =>
    axiosClient.post("/api/Customer", payload),

  // Backend không nhận PUT /{id}, nên phải PUT /api/Customer và truyền id trong body
  updateCustomer: (payload: any) =>
    axiosClient.put(`/api/Customer`, payload),

  // Backend của bạn không có API delete => tạm thời lỗi
  // Nếu backend hỗ trợ delete theo dạng PUT, cần xác nhận đúng url
  deleteCustomer: (id: number | string) =>
    axiosClient.put(`/api/Customer/delete`, { id }),
};

export default customerApi;
