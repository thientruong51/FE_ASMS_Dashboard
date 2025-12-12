import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Stack,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import GetAppIcon from "@mui/icons-material/GetApp";
import { useTranslation } from "react-i18next";

import orderApi from "@/api/orderApi";
import { getTrackingByOrder } from "@/api/trackingHistoryApi";
import { getContainerTypes } from "@/api/containerTypeApi";
import shelfTypeApi from "@/api/shelfTypeApi";
import {
  translateServiceName,
  translateProductType,
  translateStyle,
  translatePaymentStatus,
  translateStatus,
  translateActionType,
} from "@/utils/translationHelpers";

import type { OrderDetailItem } from "@/api/orderApi";
import type { TrackingHistoryItem } from "@/api/trackingHistoryApi";
import containerLocationLogApi, { type ContainerLocationLogItem } from "@/api/containerLocationLogApi";

/** Fallback maps (same as your other pages) */
const CONTAINER_TYPES_FALLBACK = [
  { containerTypeId: 1, type: "A", length: 0.5, width: 0.5, height: 0.45, imageUrl: "", price: 35000 },
  { containerTypeId: 2, type: "B", length: 0.75, width: 0.75, height: 0.45, imageUrl: "", price: 50000 },
  { containerTypeId: 3, type: "C", length: 1, width: 0.5, height: 0.45, imageUrl: "", price: 60000 },
  { containerTypeId: 4, type: "D", length: 0.5, width: 0.5, height: 0.8, imageUrl: "", price: 55000 },
];

const SHELF_TYPES_FALLBACK = [
  { shelfTypeId: 1, name: "Kệ tự quản", length: 1.55, width: 1.06, height: 2.45, price: 150000, imageUrl: "" },
  { shelfTypeId: 2, name: "Shelf_Logistics", length: 1.7, width: 1.07, height: 5.2, price: 0, imageUrl: "" },
];

/** Helpers: image detection + thumbnail */
const imageRegex = /\.(jpeg|jpg|gif|png|webp|avif|svg)$/i;
const dataImageRegex = /^data:image\/[a-zA-Z]+;base64,/;
const isImageUrl = (v: any) => {
  if (!v || typeof v !== "string") return false;
  const trimmed = v.trim();
  if (dataImageRegex.test(trimmed)) return true;
  try {
    const u = new URL(trimmed);
    return imageRegex.test(u.pathname) || /(\?|\&)format=image/i.test(trimmed);
  } catch {
    return imageRegex.test(trimmed);
  }
};
function Thumbnail({ src, alt, size = 96 }: { src: string; alt?: string; size?: number }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt ?? "img"}
      sx={{ width: size, height: size, objectFit: "cover", borderRadius: 1, border: "1px solid rgba(0,0,0,0.06)" }}
    />
  );
}

/** base64 -> utf8 (robust both browser & node) */
function base64ToUtf8(b64: string) {
  try {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      try {
        return decodeURIComponent(escape(window.atob(b64)));
      } catch {
        return window.atob(b64);
      }
    }
    const Buf = (globalThis as any).Buffer;
    if (Buf) return Buf.from(b64, "base64").toString("utf8");
  } catch {
    // fallback
  }
  return "";
}

function humanizeKey(key: string) {
  if (!key) return "";
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") 
    .replace(/[_\-]+/g, " "); 
  return spaced.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function OrderScanPage() {
  const { t } = useTranslation(["order", "common"]);

  const params = useParams<{ orderCode?: string }>();
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams("");
  const orderCodeParam = params.orderCode ?? query.get("orderCode") ?? query.get("ordercode") ?? null;
  const payloadParam = query.get("payload");

  const [payloadObj, setPayloadObj] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [details, setDetails] = useState<OrderDetailItem[]>([]);
  const [tracking, setTracking] = useState<TrackingHistoryItem[]>([]);
  const [logs, setLogs] = useState<ContainerLocationLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [containerMap, setContainerMap] = useState<Record<number, any>>({});
  const [shelfMap, setShelfMap] = useState<Record<number, any>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const containersResp = await getContainerTypes();
        const containers = Array.isArray(containersResp) ? containersResp : containersResp;
        const finalContainers = Array.isArray(containers) && containers.length > 0 ? containers : CONTAINER_TYPES_FALLBACK;
        const cmap: Record<number, any> = {};
        finalContainers.forEach((c: any) => {
          const id = Number(c.containerTypeId ?? c.id ?? c.containerTypeId);
          if (!Number.isNaN(id)) cmap[id] = c;
        });
        if (mounted) setContainerMap(cmap);
      } catch {
        const cmap: Record<number, any> = {};
        CONTAINER_TYPES_FALLBACK.forEach((c) => (cmap[Number(c.containerTypeId)] = c));
        if (mounted) setContainerMap(cmap);
      }

      try {
        const shelfResp = await shelfTypeApi.getShelfTypes();
        const shelves = shelfResp?.data ?? shelfResp;
        const finalShelves = Array.isArray(shelves) && shelves.length > 0 ? shelves : SHELF_TYPES_FALLBACK;
        const smap: Record<number, any> = {};
        finalShelves.forEach((s: any) => {
          const id = Number(s.shelfTypeId ?? s.id);
          if (!Number.isNaN(id)) smap[id] = s;
        });
        if (mounted) setShelfMap(smap);
      } catch {
        const smap: Record<number, any> = {};
        SHELF_TYPES_FALLBACK.forEach((s) => (smap[Number(s.shelfTypeId)] = s));
        if (mounted) setShelfMap(smap);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setOrder(null);
      setDetails([]);
      setTracking([]);
      setLogs([]);
      setPayloadObj(null);

      try {
        if (payloadParam) {
          const jsonStr = base64ToUtf8(payloadParam);
          const obj = JSON.parse(jsonStr);
          if (!mounted) return;
          setPayloadObj(obj);

          if (obj.order) setOrder(obj.order);
          if (Array.isArray(obj.details) && obj.details.length > 0) {
            setDetails(obj.details);
          } else if (Array.isArray(obj.orderDetails) && obj.orderDetails.length > 0) {
            setDetails(obj.orderDetails);
          } else if (obj.order && Array.isArray(obj.order.orderDetails) && obj.order.orderDetails.length > 0) {
            setDetails(obj.order.orderDetails);
          }

          if (Array.isArray(obj.tracking)) {
            setTracking(obj.tracking);
          } else if (obj.trackingFlow && Array.isArray(obj.trackingFlow)) {
            setTracking(obj.trackingFlow);
          } else if (obj.data && Array.isArray(obj.data.trackingFlow)) {
            setTracking(obj.data.trackingFlow);
          }

          if (Array.isArray(obj.logs)) setLogs(obj.logs);
        } else if (orderCodeParam) {
          const [oResp, dResp, thResp] = await Promise.allSettled([
            orderApi.getOrder(orderCodeParam),
            orderApi.getOrderDetails(orderCodeParam),
            getTrackingByOrder(orderCodeParam),
          ]);

          if (!mounted) return;

          if (oResp.status === "fulfilled") {
            setOrder(oResp.value);
            if (oResp.value?.orderDetails && Array.isArray(oResp.value.orderDetails) && oResp.value.orderDetails.length > 0) {
              setDetails(oResp.value.orderDetails);
            }
          } else {
            console.warn("getOrder failed", (oResp as any).reason);
          }

          if (dResp.status === "fulfilled") {
            const raw = (dResp as PromiseFulfilledResult<any>).value;
            const arr = raw?.data ?? raw;
            if (Array.isArray(arr) && arr.length > 0) {
              setDetails(arr);
            } else {
            }
          } else {
            console.warn("getOrderDetails failed", (dResp as any).reason);
          }

          if (thResp.status === "fulfilled") {
            const raw = (thResp as PromiseFulfilledResult<any>).value;
            let flow: any[] = [];
            if (!raw) {
              flow = [];
            } else if (Array.isArray(raw)) {
              flow = raw;
            } else if (Array.isArray(raw.data)) {
              flow = raw.data;
            } else if (raw.data && Array.isArray(raw.data.trackingFlow)) {
              flow = raw.data.trackingFlow;
            } else if (Array.isArray(raw.trackingFlow)) {
              flow = raw.trackingFlow;
            } else if (raw.data && Array.isArray(raw.data)) {
              flow = raw.data;
            } else {
              flow = raw?.data?.data?.trackingFlow ?? raw?.data?.trackingFlow ?? [];
            }
            setTracking(flow);
          } else {
            console.warn("getTrackingByOrder failed", (thResp as any).reason);
            setTracking([]);
          }

          try {
            const firstDetailId =
              (dResp.status === "fulfilled" ? ((dResp as any).value?.data ?? (dResp as any).value) : [])?.[0]?.orderDetailId ??
              (oResp.status === "fulfilled" && oResp.value?.orderDetails?.[0]?.orderDetailId);
            if (firstDetailId) {
              const resp = await containerLocationLogApi.getLogs({ orderDetailId: firstDetailId, pageNumber: 1, pageSize: 100 });
              const data = (resp as any).data ?? resp;
              if (mounted) setLogs(data?.items ?? []);
            }
          } catch (e) {
            // ignore logs error
          }
        } else {
          setError(t("order:noOrderSelected") ?? "No payload or orderCode provided.");
        }
      } catch (err: any) {
        console.error("OrderScanPage load error", err);
        setError(String(err?.message ?? err) ?? t("order:loadFailed") ?? "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [payloadParam, orderCodeParam, t]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";
  const fmtMoney = (v: any) =>
    v == null ? "-" : new Intl.NumberFormat(undefined, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v));
  const fmtDate = (v: any) => {
    if (!v) return "-";
    try {
      const s = String(v).trim();
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
    } catch {
      return String(v);
    }
  };
  const joinIfArray = (v: any): string | null => {
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "string" && v.trim()) return v;
    return null;
  };

  const getContainerLabel = (val: number | string | undefined | null) => {
    if (val == null || val === "") return null;
    const id = typeof val === "number" ? val : /^\d+$/.test(String(val)) ? Number(val) : NaN;
    if (!Number.isNaN(id) && containerMap[id]) {
      const c = containerMap[id];
      const type = c.type ?? c.name ?? `#${id}`;
      return `${type}`;
    }
    return String(val);
  };
  const getShelfLabel = (val: number | string | undefined | null) => {
    if (val == null || val === "") return null;
    const id = typeof val === "number" ? val : /^\d+$/.test(String(val)) ? Number(val) : NaN;
    if (!Number.isNaN(id) && shelfMap[id]) {
      const s = shelfMap[id];
      const name = s.name ?? s.type ?? `#${id}`;
      return `${name}`;
    }
    return String(val);
  };

  const renderOrderDetailCard = (d: any) => {
    const productNames = joinIfArray(d.productTypeNames);
    const serviceNames = joinIfArray(d.serviceNames);
    const productTranslated = productNames
      ? productNames
          .split(",")
          .map((x: any) => translateProductType(t, x.trim()))
          .join(", ")
      : null;
    const serviceTranslated = serviceNames
      ? serviceNames
          .split(",")
          .map((x: any) => translateServiceName(t, x.trim()))
          .join(", ")
      : null;

    const possibleImageFields = [d.image, d.imageUrl, d.photo, d.thumbnail, d.photoUrl, d.images];
    const imageCandidates = ([] as any[]).concat(...possibleImageFields.filter(Boolean));

    return (
      <Card key={d.orderDetailId ?? `${Math.random()}`} variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} noWrap>
                {productNames ?? `${t("order:orderDetailId")} ${d.orderDetailId ?? ""}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                #{d.orderDetailId} {d.containerCode ? `• ${d.containerCode}` : ""} {d.storageCode ? `• ${d.storageCode}` : ""}
              </Typography>

              {serviceNames && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {t("order:item.services")}: {serviceTranslated ? <span title={serviceNames}>{serviceTranslated}</span> : serviceNames}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography fontWeight={700}>{fmtMoney(d.subTotal ?? d.price)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {d.quantity != null ? `${t("order:item.qty")}: ${d.quantity}` : ""}
              </Typography>
            </Box>
          </Box>

          {imageCandidates && imageCandidates.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {imageCandidates.slice(0, 6).map((src: string, i: number) => (isImageUrl(src) ? <Thumbnail key={i} src={src} /> : null))}
            </Box>
          )}

          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={`${t("order:orderDetailId")}: ${d.orderDetailId}`} />
            {has(d.containerCode) && <Chip size="small" label={`${t("order:item.container")}: ${d.containerCode}`} />}
            {has(d.storageCode) && <Chip size="small" label={`${t("order:item.storage")}: ${d.storageCode}`} />}
            {getContainerLabel(d.containerType) && <Chip size="small" label={`${t("order:item.containerType")}: ${getContainerLabel(d.containerType)}`} color="info" />}
            {getShelfLabel(d.shelfTypeId) && <Chip size="small" label={`${t("order:item.shelfType")}: ${getShelfLabel(d.shelfTypeId)}`} color="warning" />}
            {productNames && <Chip size="small" label={productTranslated ?? productNames} />}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderTrackingList = (list: TrackingHistoryItem[]) => {
    if (!list || list.length === 0) {
      return <Typography color="text.secondary">{t("order:noTracking") ?? "No tracking history"}</Typography>;
    }
    const sorted = [...list].sort((a, b) => {
      const da = a.createAt ? new Date(a.createAt).getTime() : 0;
      const db = b.createAt ? new Date(b.createAt).getTime() : 0;
      return db - da;
    });
    return (
      <Stack spacing={1}>
        {sorted.map((it) => (
          <Card key={it.trackingHistoryId ?? Math.random()} variant="outlined">
            <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start", p: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>
                  {translateActionType(t, it.actionType) ?? translateStatus(t, it.newStatus) ?? (it.actionType ?? it.newStatus ?? "-")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {it.currentAssign ? `${it.currentAssign}` : ""} {it.createAt ? ` • ${fmtDate(it.createAt)}` : ""}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>{t("order:newStatus") ?? "New:"}</strong>{" "}
                    {translateStatus(t, it.newStatus) ?? (it.newStatus ?? "-")}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t("order:oldStatus") ?? t("order:oldFloor") ?? "Old:"}</strong>{" "}
                    {translateStatus(t, it.oldStatus) ?? (it.oldStatus ?? "-")}
                  </Typography>
                  
                </Box>
              </Box>

              <Box sx={{ width: 120, textAlign: "right" }}>
                <Typography variant="caption" color="text.secondary">
                  #{it.trackingHistoryId}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => navigator.clipboard?.writeText(JSON.stringify(it, null, 2))}>
                    {t("order:qr.copy") ?? t("common:copy") ?? "Copy"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  const downloadFullJson = () => {
    const payload = payloadObj ?? { order, details, tracking, logs };
    const content = JSON.stringify(payload, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order?.orderCode ?? orderCodeParam ?? "order"}-full.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const copyCurrentUrl = () => {
    if (typeof window !== "undefined") navigator.clipboard?.writeText(window.location.href);
  };
  const copyPayloadJson = () => {
    const payload = payloadObj ?? { order, details, tracking, logs };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  };

  const headerCustomer = useMemo(() => order?.customerName ?? order?.customer ?? order?.customerCode ?? null, [order]);
  const headerPaymentStatus = useMemo(() => order?.paymentStatus ?? null, [order]);
  const headerTotal = useMemo(() => (order?.totalPrice != null ? order.totalPrice : order?.total ?? null), [order]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <HistoryIcon />
            </Avatar>
          }
          title={
            <Box>
              <Typography fontWeight={700}>
                {t("order:labels.order")} {order?.orderCode ?? orderCodeParam ?? t("order:labels.unknown") ?? "Order"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {headerCustomer ?? ""}
              </Typography>
            </Box>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyCurrentUrl}>
                {t("order:actions.copyOrderCode") ?? t("order:actions.copyUrl") ?? "Copy URL"}
              </Button>
              <Button size="small" startIcon={<GetAppIcon />} onClick={downloadFullJson} disabled={loading}>
                {t("order:export.filenamePrefix") ?? t("order:downloadJson") ?? "Download JSON"}
              </Button>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyPayloadJson}>
                {t("order:actions.copyPayload") ?? "Copy payload"}
              </Button>
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  const base = typeof window !== "undefined" ? window.location.origin : "https://your.app";
                  const url = `${base}${typeof window !== "undefined" ? window.location.pathname : "/orders/scan"}?orderCode=${encodeURIComponent(
                    order?.orderCode ?? orderCodeParam ?? ""
                  )}`;
                  window.open(url, "_blank");
                }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Stack>
          }
        />

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              {/* Summary row */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                <Avatar sx={{ width: 72, height: 72, fontWeight: 700, bgcolor: "#e8f0ff", color: "primary.main" }}>
                  {headerCustomer ? String(headerCustomer).slice(0, 2).toUpperCase() : "OD"}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>{headerCustomer ?? order?.orderCode}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    {has(headerPaymentStatus) && (
                      <Chip
                        label={translatePaymentStatus(t, String(headerPaymentStatus ?? ""))}
                        size="small"
                        color={String(headerPaymentStatus).toLowerCase() === "paid" ? "success" : "warning"}
                      />
                    )}
                    {has(order?.status) && <Chip label={translateStatus(t, String(order?.status ?? ""))} size="small" variant="outlined" />}
                    {has(order?.style) && <Chip label={translateStyle(t, String(order?.style ?? ""))} size="small" variant="outlined" />}
                  </Stack>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  {has(headerTotal) && (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        {t("order:labels.total")}
                      </Typography>
                      <Typography fontWeight={700}>{fmtMoney(headerTotal)}</Typography>
                    </>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Order main info */}
              <Box sx={{ mb: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  {t("order:labels.orderInformation")}
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      {order && (
                        <>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:labels.orderId")}</Box>
                            <Box sx={{ flex: 1 }}>{order.orderCode}</Box>
                          </Box>
                          {order.orderDate && (
                            <Box sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:labels.orderDate")}</Box>
                              <Box sx={{ flex: 1 }}>{fmtDate(order.orderDate)}</Box>
                            </Box>
                          )}
                          {order.returnDate && (
                            <Box sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:labels.returnDate")}</Box>
                              <Box sx={{ flex: 1 }}>{fmtDate(order.returnDate)}</Box>
                            </Box>
                          )}
                        </>
                      )}
                      {/* generic properties */}
                      {order &&
                        Object.keys(order)
                          .filter((k) => !["orderCode", "orderDate", "returnDate", "totalPrice", "unpaidAmount", "customerCode", "customerName", "style", "email", "address", "phoneContact"].includes(k))
                          .map((k) => {
                            const v = order[k];
                            if (!has(v)) return null;
                            const labelKey = `order:labels.${k}`;
                            const translated = t(labelKey);
                            const label = translated && translated !== labelKey ? translated : humanizeKey(k);
                            let value = typeof v === "object" ? JSON.stringify(v) : String(v);
                            if (k.toLowerCase().includes("status")) {
                              value = translateStatus(t, v) ?? value;
                            }
                            return (
                              <Box key={k} sx={{ display: "flex", gap: 2 }}>
                                <Box sx={{ width: 200, color: "text.secondary" }}>{label}</Box>
                                <Box sx={{ flex: 1 }}>{value}</Box>
                              </Box>
                            );
                          })}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Order details */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {t("order:labels.items")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("order:page.itemsCount", { count: details.length })}
                  </Typography>
                </Box>

                {details.length === 0 ? <Typography color="text.secondary">{t("order:labels.noItems")}</Typography> : <Stack>{details.map((d) => renderOrderDetailCard(d))}</Stack>}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Tracking */}
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {t("order:trackingHistory") ?? t("order:trackingHistory")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tracking.length} {t("order:records")}
                  </Typography>
                </Box>

                {renderTrackingList(tracking)}
              </Box>

              {/* Optional: container location logs (if present) */}
              {logs && logs.length > 0 && (
                <>
                  <Divider sx={{ mt: 3, mb: 2 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {t("order:containerLocationLogTitle")}
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {logs.map((l) => (
                        <Card key={l.containerLocationLogId} variant="outlined">
                          <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography fontWeight={700}>{l.containerCode ?? "-"}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {l.performedBy ?? ""} • {fmtDate(l.updatedDate)}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>{t("order:oldFloor")}</strong>: {l.oldFloor ?? "-"}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t("order:currentFloor")}</strong>: {l.currentFloor ?? "-"}
                                </Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Chip label={l.reason ?? "-"} size="small" />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
