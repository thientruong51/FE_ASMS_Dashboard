import axiosClient from "./axiosClient";

export interface OrderRespItem {
  data: OrderRespItem;
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

  customerName?: string | null;
  phoneContact?: string | null;
  email?: string | null;
  note?: string | null;
  address?: string | null;
  imageUrls?: string[] | null;         

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

  length?: number | null;
  width?: number | null;
  height?: number | null;
  isOversize?: boolean | null;
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


export async function getOrder(orderCode: string, params?: Record<string, any>): Promise<OrderRespItem> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}`;
  const resp = await axiosClient.get<OrderRespItem>(url, { params });
  return resp.data;
}

function toNumberOrNull(v: any): number | null {
  if (v === null || typeof v === "undefined") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function getOrderDetails(orderCode: string, params?: Record<string, any>): Promise<OrderDetailListResponse> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}/details`;
  const resp = await axiosClient.get<OrderDetailListResponse>(url, { params });

  const raw = resp.data?.data ?? [];
  const normalized = (raw as any[]).map((it) => {
    const length = toNumberOrNull(it.length ?? it?.length);
    const width = toNumberOrNull(it.width ?? it?.width);
    const height = toNumberOrNull(it.height ?? it?.height);

    let isOversize: boolean | null = null;
    if (typeof it.isOversize === "boolean") isOversize = it.isOversize;
    else if (typeof it.isOversize === "number") isOversize = it.isOversize === 1;
    else if (typeof it.isOversize === "string") {
      const s = it.isOversize.toLowerCase();
      isOversize = s === "true" || s === "1" ? true : s === "false" || s === "0" ? false : null;
    } else {
      isOversize = null;
    }

    return {
      ...it,
      length,
      width,
      height,
      isOversize,
      price: toNumberOrNull(it.price),
      subTotal: toNumberOrNull(it.subTotal ?? it.subtotal),
    } as OrderDetailItem;
  });

  return {
    ...resp.data,
    data: normalized,
  };
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
