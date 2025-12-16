import contactApi from "@/api/contactApi";
import orderApi from "@/api/orderApi";
import { setContactCounters } from "@/features/contact/contactSlice";
import { setPendingOrderCount } from "@/features/orders/ordersSlice";
import type { AppDispatch } from "@/app/store";
import * as trackingApi from "@/api/trackingHistoryApi";
import { setPendingTrackingCount } from "@/features/tracking/trackingSlice";
import { setPendingStorageCount } from "@/features/storage/storageSlice";
import { getOrders, getOrderDetails } from "@/api/orderApi";

export async function bootstrapSidebarData(dispatch: AppDispatch) {
  try {
    const [contactsResp, ordersResp] = await Promise.all([
      contactApi.getContacts({ page: 1, pageSize: 1000 }),
      orderApi.getOrders({ page: 1, pageSize: 1000 }),
    ]);

    /* ---------- CONTACT ---------- */
    const contacts =
      Array.isArray(contactsResp)
        ? contactsResp
        :  contactsResp?.data ?? [];

    const contactCount = contacts.filter(
      (c: any) => c?.isActive === true && !c.orderCode
    ).length;

    const supportCount = contacts.filter(
      (c: any) => c?.isActive === true && !!c.orderCode
    ).length;

    dispatch(
      setContactCounters({
        contact: contactCount,
        support: supportCount,
      })
    );

    /* ---------- ORDER ---------- */
    const orders = ordersResp?.data ?? [];

    const pendingOrderCount = orders.filter(
      (o: any) => String(o.status).toLowerCase() !== "completed"
    ).length;

    dispatch(setPendingOrderCount(pendingOrderCount));
  } catch (err) {
    console.error("bootstrapSidebarData failed", err);
  }
  const trackingResp = await trackingApi.getTrackingHistories({
  page: 1,
  pageSize: 1000,
});
/* ---------- TRACKING ---------- */
const trackings = trackingResp?.data ?? [];

const pendingTrackingCount = trackings.filter((it: any) => {
  const status = String(it.newStatus ?? "").toLowerCase();
  return status !== "completed" && status !== "cancelled";
}).length;

dispatch(setPendingTrackingCount(pendingTrackingCount));

/* ---------- STORAGE (FIXED) ---------- */
  const processingOrdersResp = await getOrders({
    pageNumber: 1,
    pageSize: 50,
    style: "full",
    status: "processing",
  });

  const processingOrders: any[] = processingOrdersResp?.data ?? [];

  const detailResponses = await Promise.all(
    processingOrders.map((o) => getOrderDetails(o.orderCode))
  );

  const pendingOrderCodes = new Set<string>();

  processingOrders.forEach((o, idx) => {
    const items = detailResponses[idx]?.data ?? [];
    const hasPending = items.some(
      (it: any) => !it.storageCode && it.isPlaced !== false
    );
    if (hasPending) pendingOrderCodes.add(o.orderCode);
  });

  dispatch(setPendingStorageCount(pendingOrderCodes.size));

}

