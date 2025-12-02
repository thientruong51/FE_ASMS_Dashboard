// src/api/trackingHistoryApi.ts
import axiosClient from "./axiosClient";

/**
 * Tracking history item returned by the backend
 */
export interface TrackingHistoryItem {
  trackingHistoryId: number;
  orderDetailCode?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  actionType?: string | null;
  createAt?: string | null; // backend uses "createAt" (string date)
  currentAssign?: string | null;
  nextAssign?: string | null;
  image?: string | null;
  orderCode?: string | null;
}

/**
 * Paginated list response
 */
export interface TrackingHistoryListResponse {
  data: TrackingHistoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

/**
 * Payload used to create/update a tracking history
 * (make fields optional to match swagger examples)
 */
export interface TrackingHistoryPayload {
  orderDetailCode?: string | null;
  orderCode?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  actionType?: string | null;
  createAt?: string | null; // or backend may fill this
  currentAssign?: string | null;
  nextAssign?: string | null;
  image?: string | null;
}

/**
 * Get tracking histories (supports query params for paging / filtering).
 * Example params: { page: 1, pageSize: 10, orderCode: '20251127-0004' }
 */
export async function getTrackingHistories(params?: Record<string, any>): Promise<TrackingHistoryListResponse> {
  const resp = await axiosClient.get<TrackingHistoryListResponse>("/api/TrackingHistory", { params });
  return resp.data;
}

/**
 * Get tracking histories filtered by order code (route from swagger: /api/TrackingHistory/order/{orderCode})
 */
export async function getTrackingByOrder(orderCode: string): Promise<TrackingHistoryListResponse> {
  const resp = await axiosClient.get<TrackingHistoryListResponse>(`/api/TrackingHistory/order/${encodeURIComponent(orderCode)}`);
  return resp.data;
}

/**
 * Create a new tracking history
 */
export async function createTrackingHistory(payload: TrackingHistoryPayload): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.post<TrackingHistoryItem>("/api/TrackingHistory", payload);
  return resp.data;
}

/**
 * Update tracking history status via the dedicated endpoint (swagger shows POST /api/TrackingHistory/update-status)
 * Use this when backend expects a status-update shaped payload.
 */
export async function updateTrackingStatus(payload: TrackingHistoryPayload): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.post<TrackingHistoryItem>("/api/TrackingHistory/update-status", payload);
  return resp.data;
}

/**
 * Update an existing tracking history by id
 */
export async function updateTrackingHistory(id: number, payload: TrackingHistoryPayload): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.put<TrackingHistoryItem>(`/api/TrackingHistory/${id}`, payload);
  return resp.data;
}

/**
 * Delete a tracking history by id
 */
export async function deleteTrackingHistory(id: number): Promise<void> {
  await axiosClient.delete(`/api/TrackingHistory/${id}`);
}
