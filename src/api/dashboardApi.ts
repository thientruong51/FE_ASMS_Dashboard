import axiosClient from "./axiosClient";



export interface StorageTypeDetail {
  storageTypeId: number;
  storageTypeName: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  percentUsed: number;
  percentRemaining: number;
}

export interface StorageTypeSummary {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  percentUsed: number;
  percentRemaining: number;
}

export interface BuildingUsageItem {
  buildingId: number;
  buildingName: string;
  buildingCode: string;
  buildingType: "Self-Storage" | "WareHouse";

  totalStorages: number | null;
  totalVolume: number | null;
  usedVolume: number | null;
  percentUsed: number | null;
  percentRemaining: number | null;

  storageTypeDetails: StorageTypeDetail[] | null;
  storageTypeSummary: StorageTypeSummary | null;
}

export interface OverallSummary {
  totalBuildings: number;
  totalStorages: number;
  totalVolume: number;
  usedVolume: number;
  percentUsed: number;
  percentRemaining: number;
}

export interface BuildingUsageSummaryResp {
  success: boolean;
  data: {
    buildings: BuildingUsageItem[];
    overallSummary: OverallSummary;
  };
}


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

  getBuildingUsageSummary: () =>
    axiosClient.get<BuildingUsageSummaryResp>(
      "/api/Dashboard/building-usage-summary"
    ),
};

export default dashboardApi;
