import axiosClient from "./axiosClient";



export interface TrackingHistoryItem {
  trackingHistoryId: number;
  orderDetailCode?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  actionType?: string | null;
  createAt?: string | null;
  currentAssign?: string | null;
  nextAssign?: string | null;

  image?: string | null;
  images?: string[] | null;

  orderCode?: string | null;
}


export interface TrackingHistoryListResponse {
  data: TrackingHistoryItem[];
  currentStatus?: string | null;

  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface TrackingHistoryPayload {
  orderDetailCode?: string | null;
  orderCode?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  actionType?: string | null;
  createAt?: string | null;
  currentAssign?: string | null;
  nextAssign?: string | null;

  image?: string | null;
  images?: string[] | null;
}

export interface UpdateTrackingImagePayload {
  orderCode: string;
  image: string[];
}


export async function getTrackingHistories(
  params?: Record<string, any>
): Promise<TrackingHistoryListResponse> {
  const resp = await axiosClient.get<TrackingHistoryListResponse>(
    "/api/TrackingHistory",
    { params }
  );
  return resp.data;
}


export async function getTrackingByOrder(
  orderCode: string
): Promise<TrackingHistoryListResponse> {
  const resp = await axiosClient.get<TrackingHistoryListResponse>(
    `/api/TrackingHistory/order/${encodeURIComponent(orderCode)}`
  );
  return resp.data;
}

export async function createTrackingHistory(
  payload: TrackingHistoryPayload
): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.post<TrackingHistoryItem>(
    "/api/TrackingHistory",
    payload
  );
  return resp.data;
}

export async function updateTrackingStatus(
  payload: TrackingHistoryPayload
): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.post<TrackingHistoryItem>(
    "/api/TrackingHistory/update-status",
    payload
  );
  return resp.data;
}


export async function updateTrackingHistory(
  id: number,
  payload: TrackingHistoryPayload
): Promise<TrackingHistoryItem> {
  const resp = await axiosClient.put<TrackingHistoryItem>(
    `/api/TrackingHistory/${id}`,
    payload
  );
  return resp.data;
}

export async function deleteTrackingHistory(id: number): Promise<void> {
  await axiosClient.delete(`/api/TrackingHistory/${id}`);
}


export async function updateTrackingImage(
  orderCode: string,
  images: string[]
): Promise<TrackingHistoryItem> {
  const payload: UpdateTrackingImagePayload = {
    orderCode,
    image: images,
  };

  const resp = await axiosClient.put<TrackingHistoryItem>(
    "/api/OrderStatus/tracking/update-image",
    payload
  );
  return resp.data;
}
