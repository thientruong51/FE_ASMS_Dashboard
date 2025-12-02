// src/api/orderApi.ts
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
  // NOTE: summary may contain only these fields; full order may have many more
}

export interface OrderListResponse {
  data: OrderRespItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface OrderDetailItem {
  productTypeNames: any;
  serviceNames: any;
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
  isPlaced?: boolean | null;
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

/**
 * Get full order by orderCode.
 * Backend endpoint assumed: GET /api/Order/{orderCode}
 * If your backend uses a different URL, change it here.
 */
export async function getOrder(orderCode: string, params?: Record<string, any>): Promise<any> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}`;
  const resp = await axiosClient.get<any>(url, { params });
  return resp.data;
}

export async function getOrderDetails(orderCode: string, params?: Record<string, any>): Promise<OrderDetailListResponse> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}/details`;
  const resp = await axiosClient.get<OrderDetailListResponse>(url, { params });
  return resp.data;
}

export async function getOrdersWithDetails(
  params?: Record<string, any>,
  options?: { filterUnplaced?: boolean }
) {
  const ordersResp = await getOrders(params);
  const orders = ordersResp.data ?? [];

  const detailsPromises = orders.map(async (o) => {
    try {
      const detailsResp = await getOrderDetails(o.orderCode);
      const rawDetails = detailsResp.data ?? [];
      const details = options?.filterUnplaced
        ? rawDetails.filter((d) => d.isPlaced === false)
        : rawDetails;

      return {
        order: o,
        details,
        detailsMeta: { success: detailsResp.success, message: detailsResp.message },
      };
    } catch (err) {
      return {
        order: o,
        details: [],
        detailsMeta: { success: false, message: (err as any)?.message ?? "Request failed" },
      };
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


export async function getUnplacedDetailsAcrossOrders(params?: Record<string, any>) {
  const ordersResp = await getOrders(params);
  const orders = ordersResp.data ?? [];

  const detailsPromises = orders.map(async (o) => {
    try {
      const detailsResp = await getOrderDetails(o.orderCode);
      const rawDetails = detailsResp.data ?? [];
      const unplaced = rawDetails.filter((d) => d.isPlaced === false).map((d) => ({
        ...d,
        _orderCode: o.orderCode,
        _orderStatus: o.status,
        _orderPaymentStatus: o.paymentStatus,
        _orderDepositDate: o.depositDate,
        _orderReturnDate: o.returnDate,
        _orderTotalPrice: o.totalPrice,
      }));
      return unplaced;
    } catch (err) {
      return [];
    }
  });

  const lists = await Promise.all(detailsPromises);
  const flat = lists.flat();

  return {
    page: ordersResp.page,
    pageSize: ordersResp.pageSize,
    totalCount: ordersResp.totalCount,
    totalPages: ordersResp.totalPages,
    items: flat,
  };
}

export default {
  getOrders,
  getOrder,
  getOrderDetails,
  getOrdersWithDetails,
  getUnplacedDetailsAcrossOrders,
};
