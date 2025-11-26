import axiosClient from "./axiosClient";


export interface OrderRespItem {
  orderCode: string;
  customerCode?: string | null;
  orderDate?: string | null;      
  depositDate?: string | null;
  returnDate?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number | null;
  unpaidAmount?: number | null;
  style?: "full" | "self" | string | null;
}

export interface OrderListResponse {
  data: OrderRespItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface OrderDetailItem {
  orderDetailId: number;
  storageCode?: string | null;
  containerCode?: string | null;
  floorCode?: string | null;
  floorNumber?: number | null;
  price?: number | null;
  quantity?: string | number | null;
  subTotal?: number | null;
  image?: string | null;
  containerType?: number | null;
  containerQuantity?: number | null;
  storageTypeId?: number | null;
  shelfTypeId?: number | null;
  shelfQuantity?: number | null;
  productTypeIds?: number[];
  serviceIds?: number[];
}

export interface OrderDetailListResponse {
  success: boolean;
  message?: string;
  data: OrderDetailItem[];
}


export async function getOrders(params?: Record<string, any>): Promise<OrderListResponse> {
  const resp = await axiosClient.get<OrderListResponse>("/api/Order", { params });
  return resp.data;
}


export async function getOrderDetails(orderCode: string): Promise<OrderDetailListResponse> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}/details`;
  const resp = await axiosClient.get<OrderDetailListResponse>(url);
  return resp.data;
}


export async function getOrdersWithDetails(params?: Record<string, any>) {
  const ordersResp = await getOrders(params);
  const orders = ordersResp.data ?? [];

  const detailsPromises = orders.map(async (o) => {
    try {
      const detailsResp = await getOrderDetails(o.orderCode);
      return { order: o, details: detailsResp.data, detailsMeta: { success: detailsResp.success, message: detailsResp.message } };
    } catch (err) {
      return { order: o, details: [], detailsMeta: { success: false, message: (err as any)?.message ?? "Request failed" } };
    }
  });

  const ordersWithDetails = await Promise.all(detailsPromises);

  return {
    page: ordersResp.page,
    pageSize: ordersResp.pageSize,
    totalCount: ordersResp.totalCount,
    totalPages: ordersResp.totalPages,
    items: ordersWithDetails,
  };
}

export default {
  getOrders,
  getOrderDetails,
  getOrdersWithDetails,
};
