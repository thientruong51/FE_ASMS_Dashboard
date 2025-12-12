import axiosClient from "./axiosClient";

export const dashboardApi = {
  getOrderCount: (params?: {
    date?: string;
    status?: string;
    type?: "day" | "week" | "month" | "year";
  }) =>
    axiosClient.get("/api/Dashboard/Get-Number-of-Orders", {
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

  getBuildingUsageSummary: () =>
    axiosClient.get("/api/Dashboard/building-usage-summary"),
};

export default dashboardApi;
