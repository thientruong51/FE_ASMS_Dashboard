import axiosClient from "./axiosClient";

export const staffApi = {
  getEmployees: (params?: Record<string, any>) => axiosClient.get("/api/Employee", { params }),

  getEmployeeById: (id: number) => axiosClient.get(`/api/Employee/${id}`),

  createEmployee: (payload: any) => axiosClient.post("/api/Employee", payload),

  updateEmployee: (id: number, payload: any) => axiosClient.put(`/api/Employee/${id}`, payload),

  deleteEmployee: (id: number) => axiosClient.delete(`/api/Employee/${id}`),

  getRoles: (params?: any) => axiosClient.get("/api/EmployeeRole", { params }),
  getBuildings: (params?: any) => axiosClient.get("/api/Building", { params }),
};

export default staffApi;
