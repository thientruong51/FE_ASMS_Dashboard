import axiosClient from "./axiosClient";

const BASE = "/api/ShortLink";

/* =======================
 * Types
 * ======================= */

export type CreateShortLinkRequest = {
  originalUrl: string;
  orderCode?: string;
  orderDetailId?: number;
};

export type ShortLinkInfo = {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string | null;
};

/* =======================
 * API functions
 * ======================= */

/**
 * Tạo short link (idempotent theo orderCode / orderDetailId)
 * POST /api/ShortLink/create
 */
export async function createShortLink(
  payload: CreateShortLinkRequest
): Promise<ShortLinkInfo> {
  const resp = await axiosClient.post<ShortLinkInfo>(
    `${BASE}/create`,
    payload
  );
  return resp.data;
}

/**
 * Lấy short link theo OrderCode
 * GET /api/ShortLink/order/{orderCode}
 */
export async function getShortLinkByOrderCode(
  orderCode: string
): Promise<ShortLinkInfo> {
  const resp = await axiosClient.get<ShortLinkInfo>(
    `${BASE}/order/${encodeURIComponent(orderCode)}`
  );
  return resp.data;
}

/**
 * Lấy short link theo OrderDetailId
 * GET /api/ShortLink/order-detail/{orderDetailId}
 */
export async function getShortLinkByOrderDetailId(
  orderDetailId: number
): Promise<ShortLinkInfo> {
  const resp = await axiosClient.get<ShortLinkInfo>(
    `${BASE}/order-detail/${orderDetailId}`
  );
  return resp.data;
}

/* =======================
 * Export object
 * ======================= */

const shortLinkApi = {
  createShortLink,
  getShortLinkByOrderCode,
  getShortLinkByOrderDetailId,
};

export default shortLinkApi;
