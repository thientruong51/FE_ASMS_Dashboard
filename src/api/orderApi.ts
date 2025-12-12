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

  customerName?: string | null;
  phoneContact?: string | null;
  email?: string | null;
  note?: string | null;
  address?: string | null;
  passkey?: number | null;
  refund?: number | null;
  imageUrls?: string[] | null;
}

export interface OrderListResponse {
  data: OrderRespItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  success?: boolean;
  message?: string;
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

  isPlaced?: boolean | null;

  length?: number | null;
  width?: number | null;
  height?: number | null;
  isOversize?: boolean | null;

  productTypeNames?: string[];
  serviceNames?: string[];
}

export interface OrderDetailListResponse {
  success: boolean;
  message?: string;
  data: OrderDetailItem[] | any[]; // raw come from API; we'll normalize
}

/**
 * Helpers
 */
function toNumberOrNull(v: any): number | null {
  if (v === null || typeof v === "undefined") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * API calls
 */

export async function getOrders(params?: Record<string, any>): Promise<OrderListResponse> {
  const resp = await axiosClient.get<OrderListResponse>("/api/Order", { params });
  // Some backends wrap the result in { data: [...] }, some return directly.
  // We assume axiosClient returns axios response and resp.data is the payload matching OrderListResponse.
  return resp.data;
}

export async function getOrder(orderCode: string, params?: Record<string, any>): Promise<OrderRespItem> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}`;
  const resp = await axiosClient.get<OrderRespItem>(url, { params });
  return resp.data;
}

export async function getOrderDetails(orderCode: string, params?: Record<string, any>): Promise<OrderDetailListResponse> {
  const url = `/api/Order/${encodeURIComponent(orderCode)}/details`;
  const resp = await axiosClient.get<OrderDetailListResponse>(url, { params });

  const raw = resp.data?.data ?? [];
  const normalized = (raw as any[]).map((it) => {
    // normalize numeric fields
    const length = toNumberOrNull(it.length ?? it?.length);
    const width = toNumberOrNull(it.width ?? it?.width);
    const height = toNumberOrNull(it.height ?? it?.height);

    // normalize price/subTotal
    const price = toNumberOrNull(it.price);
    const subTotal = toNumberOrNull(it.subTotal ?? it.subtotal ?? it.sub_total);

    // normalize isOversize
    let isOversize: boolean | null = null;
    if (typeof it.isOversize === "boolean") isOversize = it.isOversize;
    else if (typeof it.isOversize === "number") isOversize = it.isOversize === 1;
    else if (typeof it.isOversize === "string") {
      const s = it.isOversize.toLowerCase();
      if (s === "true" || s === "1") isOversize = true;
      else if (s === "false" || s === "0") isOversize = false;
      else isOversize = null;
    } else {
      isOversize = null;
    }

    // normalize product/service names as arrays
    const productTypeNames = Array.isArray(it.productTypeNames) ? it.productTypeNames : typeof it.productTypeNames === "string" && it.productTypeNames ? [it.productTypeNames] : [];
    const serviceNames = Array.isArray(it.serviceNames) ? it.serviceNames : typeof it.serviceNames === "string" && it.serviceNames ? [it.serviceNames] : [];

    // normalize isPlaced (some apis send 0/1 or "true"/"false")
    let isPlaced: boolean | null = null;
    if (typeof it.isPlaced === "boolean") isPlaced = it.isPlaced;
    else if (typeof it.isPlaced === "number") isPlaced = it.isPlaced === 1;
    else if (typeof it.isPlaced === "string") {
      const s = it.isPlaced.toLowerCase();
      if (s === "true" || s === "1") isPlaced = true;
      else if (s === "false" || s === "0") isPlaced = false;
      else isPlaced = null;
    } else {
      isPlaced = null;
    }

    // normalized item
    const normalizedItem: OrderDetailItem = {
      orderDetailId: typeof it.orderDetailId === "number" ? it.orderDetailId : Number(it.orderDetailId),
      storageCode: it.storageCode ?? null,
      containerCode: it.containerCode ?? null,
      floorCode: it.floorCode ?? null,
      floorNumber: toNumberOrNull(it.floorNumber),
      price,
      quantity: it.quantity ?? null,
      subTotal,
      image: it.image ?? null,
      containerType: toNumberOrNull(it.containerType),
      containerQuantity: toNumberOrNull(it.containerQuantity),
      storageTypeId: toNumberOrNull(it.storageTypeId),
      shelfTypeId: toNumberOrNull(it.shelfTypeId),
      shelfQuantity: toNumberOrNull(it.shelfQuantity),
      isPlaced,
      length,
      width,
      height,
      isOversize,
      productTypeNames,
      serviceNames,
    };

    return normalizedItem;
  });

  return {
    ...resp.data,
    data: normalized,
  };
}

/**
 * Convenience functions that fetch orders and then their details.
 * WARNING: these functions will perform N additional requests (one per order).
 * Use sparingly or add server-side endpoints to avoid N+1 problems.
 */

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
      const details = options?.filterUnplaced ? (rawDetails as OrderDetailItem[]).filter((d) => d.isPlaced === false) : (rawDetails as OrderDetailItem[]);

      return {
        order: o,
        details,
        detailsMeta: { success: detailsResp?.success ?? true, message: detailsResp?.message ?? undefined },
      };
    } catch (err) {
      return {
        order: o,
        details: [] as OrderDetailItem[],
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
      const unplaced = (rawDetails as OrderDetailItem[])
        .filter((d) => d.isPlaced === false)
        .map((d) => ({
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
