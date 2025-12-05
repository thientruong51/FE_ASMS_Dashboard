import axiosClient from "./axiosClient";

export const dashboardApi = {

  getOrderCount: (params?: {
    date?: string;
    status?: string;
    isWeekly?: boolean;
  }) =>
    axiosClient.get("/api/Dashboard/Get-Number-of-Oders", {
      params,
    }),


  getRevenue: (params?: {
    date?: string;
    type?: "day" | "week" | "month" | "year";
  }) =>
    axiosClient.get("/api/Dashboard/Revenue", {
      params,
    }),


  getWarehouseUsagePercent: () =>
    axiosClient.get("/api/Dashboard/warehouse-usage-percent"),
};

export default dashboardApi;
