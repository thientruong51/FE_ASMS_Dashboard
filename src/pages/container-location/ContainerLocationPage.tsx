import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import { useTranslation } from "react-i18next";

import containerLocationLogApi, { type ContainerLocationLogItem } from "@/api/containerLocationLogApi";
import { getContainerTypes } from "@/api/containerTypeApi";
import shelfTypeApi from "@/api/shelfTypeApi";
import { translateServiceName } from "@/utils/translationHelpers";

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

function Thumbnail({ src, alt, size = 126 }: { src: string; alt?: string; size?: number }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt ?? "img"}
      sx={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 1,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    />
  );
}

const renderValue = (v: any) => {
  if (v == null) return "-";
  if (Array.isArray(v)) {
    const images = v.filter((x) => typeof x === "string" && isImageUrl(x));
    const others = v.filter((x) => !images.includes(x));
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {images.map((src, i) => (
          <Thumbnail key={i} src={src} size={96} />
        ))}
        {others.length > 0 && <span>{others.join(", ")}</span>}
      </Box>
    );
  }

  if (typeof v === "string" && isImageUrl(v)) {
    return <Thumbnail src={v} size={72} />;
  }

  if (typeof v === "object") {
    try {
      return String(JSON.stringify(v, null, 2));
    } catch {
      return String(v);
    }
  }

  return String(v);
};

function humanizeKey(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

function base64ToUtf8(b64: string) {
  try {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return decodeURIComponent(escape(window.atob(b64)));
    }
    const Buf = (globalThis as any).Buffer;
    if (Buf) return Buf.from(b64, "base64").toString("utf8");
  } catch {
    try {
      if (typeof window !== "undefined" && typeof window.atob === "function") return window.atob(b64);
    } catch {}
  }
  return "";
}

export default function ContainerLocationPage() {
  const { t } = useTranslation(["order", "common"]);

  const [payloadObj, setPayloadObj] = useState<any | null>(null);
  const [logs, setLogs] = useState<ContainerLocationLogItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [containerMap, setContainerMap] = useState<Record<number, any>>({});
  const [shelfMap, setShelfMap] = useState<Record<number, any>>({});

  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams("");
  const orderDetailIdParam = query.get("orderDetailId");
  const payloadParam = query.get("payload");
  const orderCodeParam = query.get("orderCode");

  const orderDetailId = orderDetailIdParam ? Number(orderDetailIdParam) : null;

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
      try {
        if (payloadParam) {
          const jsonStr = base64ToUtf8(payloadParam);
          const obj = JSON.parse(jsonStr);
          if (!mounted) return;
          setPayloadObj(obj);
          setLogs(Array.isArray(obj.logs) ? obj.logs : []);
        } else if (orderDetailId != null) {
          const resp = await containerLocationLogApi.getLogs({ orderDetailId, pageNumber: 1, pageSize: 100 });
          const data = (resp as any).data ?? resp;
          if (!mounted) return;
          setPayloadObj(null);
          setLogs(data?.items ?? []);
        } else {
          setError(t("order:noOrderDetailSelected") ?? "No payload or orderDetailId provided.");
          setPayloadObj(null);
          setLogs([]);
        }
      } catch (err: any) {
        console.error("Failed to load container location data", err);
        if (!mounted) return;
        setError(String(err?.message ?? err) ?? "Error");
        setPayloadObj(null);
        setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [payloadParam, orderDetailId, t]);

  const joinIfArray = (v: any): string | null => {
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "string" && v.trim()) return v;
    return null;
  };
  const has = (val: any) => val !== null && val !== undefined && val !== "";
  const fmtMoney = (v: any) =>
    v == null ? "-" : new Intl.NumberFormat(undefined, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v));
  const fmtDate = (v: any) => {
    if (!v) return "-";
    try {
      const s = String(v).trim();
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
    } catch {
      return String(v);
    }
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

  const detail = useMemo(() => {
    if (payloadObj?.detail) return payloadObj.detail;
    if (logs && logs.length > 0) {
      const sample = logs[0] as any;
      return {
        orderDetailId: orderDetailId ?? sample.orderDetailId ?? null,
        containerCode: sample.containerCode ?? null,
      };
    }
    return null;
  }, [payloadObj, logs, orderDetailId]);

  const labelFor = (k: string) => {
    const i18nKey = `labels.${k}`;
    const looked = t(i18nKey);
    if (looked && looked !== i18nKey) return looked;
    const alt = t(k);
    if (alt && alt !== k) return alt;
    return humanizeKey(k);
  };

  const withTooltip = (original?: string | null, translated?: string | null) => {
    const orig = original ?? "";
    const trans = translated ?? orig ?? "-";
    if (!orig) return <span>{trans}</span>;
    return (
      <Box component="span" sx={{ display: "inline-block", maxWidth: 480, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={orig}>
        {trans}
      </Box>
    );
  };

  const renderDetailBlock = (d: any) => {
    if (!d) return null;

    const serviceNames = joinIfArray(d.serviceNames);

    const serviceTranslated = serviceNames
      ? serviceNames
          .split(",")
          .map((x: string) => translateServiceName(t, x.trim()))
          .join(", ")
      : null;

    const possibleImageFields = [d.image, d.imageUrl, d.photo, d.thumbnail, d.photoUrl, d.images];
    const imageCandidates = ([] as any[]).concat(...possibleImageFields.filter(Boolean));

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1}>
            {/* Order / basic meta */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:orderId") ?? labelFor("orderDetailId")}</Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>{d.orderDetailId ?? "-"}</Typography>
                {d.containerCode && <Typography variant="caption" color="text.secondary">{d.containerCode}</Typography>}
              </Box>
            </Box>

            {/* images */}
            {imageCandidates && imageCandidates.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t("order:images") ?? labelFor("images")}</Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  {imageCandidates.slice(0, 6).map((src: string, i: number) => (isImageUrl(src) ? <Thumbnail key={i} src={src} size={96} /> : null))}
                </Box>
              </Box>
            )}

            {/* quantity / money */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ width: 200, color: "text.secondary" }}>{t("item.qty")}</Box>
              <Box sx={{ flex: 1 }}>{d.quantity ?? "-"}</Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ width: 200, color: "text.secondary" }}>{t("labels.total")}</Box>
              <Box sx={{ flex: 1 }}>{fmtMoney(d.subTotal ?? d.price)}</Box>
            </Box>

            {/* style, services */}
            {d.style && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("table.style") ?? labelFor("style")}</Box>
                <Box sx={{ flex: 1 }}>{d.style}</Box>
              </Box>
            )}

            {serviceNames && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("item.services")}</Box>
                <Box sx={{ flex: 1 }}>{withTooltip(String(serviceNames), serviceTranslated)}</Box>
              </Box>
            )}

            {/* explicit mapping for common container-related fields (so they show localized labels) */}
            {has(d.containerCode) && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:containerCode") ?? labelFor("containerCode")}</Box>
                <Box sx={{ flex: 1 }}>{d.containerCode}</Box>
              </Box>
            )}
            {has(d.floorCode) && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:floorCode") ?? labelFor("floorCode")}</Box>
                <Box sx={{ flex: 1 }}>{d.floorCode}</Box>
              </Box>
            )}
            {has(d.containerType) && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:containerType") ?? labelFor("containerType")}</Box>
                <Box sx={{ flex: 1 }}>{getContainerLabel(d.containerType) ?? d.containerType}</Box>
              </Box>
            )}
            {has(d.containerQuantity) && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:containerQuantity") ?? labelFor("containerQuantity")}</Box>
                <Box sx={{ flex: 1 }}>{d.containerQuantity}</Box>
              </Box>
            )}
            {d.isPlaced != null && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 200, color: "text.secondary" }}>{t("order:isPlaced") ?? labelFor("isPlaced")}</Box>
                <Box sx={{ flex: 1 }}>{String(d.isPlaced)}</Box>
              </Box>
            )}

            {/* generic properties (same filter from drawer) */}
            {d &&
              Object.keys(d)
                .filter(
                  (k) =>
                    ![
                      "orderDetailId",
                      "orderId",
                      "orderCode",
                      "image",
                      "imageUrl",
                      "images",
                      "photo",
                      "thumbnail",
                      "photoUrl",
                      "subTotal",
                      "price",
                      "quantity",
                      "productTypeNames",
                      "serviceNames",
                      "style",
                      "containerCode",
                      "floorCode",
                      "containerType",
                      "containerQuantity",
                      "isPlaced",
                    ].includes(k)
                )
                .map((k) => {
                  const v = d[k];
                  if (!has(v)) return null;
                  let display = renderValue(v);
                  if (k.toLowerCase().includes("container") && (typeof v === "number" || /^\d+$/.test(String(v)))) {
                    const mapped = getContainerLabel(v);
                    if (mapped) display = mapped;
                  }
                  if (k.toLowerCase().includes("shelf") && (typeof v === "number" || /^\d+$/.test(String(v)))) {
                    const mapped = getShelfLabel(v);
                    if (mapped) display = mapped;
                  }
                  return (
                    <Box key={k} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ width: 200, color: "text.secondary" }}>{labelFor(k)}</Box>
                      <Box sx={{ flex: 1 }}>{display}</Box>
                    </Box>
                  );
                })}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <HistoryIcon />
            </Avatar>
          }
          title={
            <Typography fontWeight={700}>
              {t("order:containerLocationLogTitle")} • {t("order:orderDetailId")}:{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>{payloadObj?.detail?.orderDetailId ?? orderDetailId ?? "-"}</Box>
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {payloadObj ? t("order:qr.hint") : t("order:logsFetched")}
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => {
                  const toCopy = payloadObj ? JSON.stringify(payloadObj, null, 2) : JSON.stringify({ orderDetailId, logs }, null, 2);
                  navigator.clipboard?.writeText(toCopy || "");
                }}
              >
                {t("order:qr.copy") ?? t("copyPayload") ?? "Copy payload"}
              </Button>

              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  const base = typeof window !== "undefined" ? window.location.origin : "https://your.app";
                  const url = `${base}/container-location?orderDetailId=${orderDetailId ?? payloadObj?.detail?.orderDetailId ?? ""}${orderCodeParam ? `&orderCode=${encodeURIComponent(orderCodeParam)}` : ""}`;
                  if (typeof window !== "undefined") window.open(url, "_blank");
                }}
                aria-label={t("openInNew") ?? "open"}
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
              {/* Detail area (same as drawer) */}
              {renderDetailBlock(detail)}

              {/* Logs list */}
              <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight={700}>
                  {t("order:containerLocationLogTitle")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {logs ? `${logs.length} ${t("order:records")}` : ""}
                </Typography>
              </Box>

              {(!logs || logs.length === 0) ? (
                <Typography color="text.secondary">{t("order:noLocationLogs")}</Typography>
              ) : (
                <Stack spacing={1}>
                  {logs.map((l) => (
                    <Card key={l.containerLocationLogId} variant="outlined">
                      <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start", p: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Typography fontWeight={700}>{l.containerCode ?? "-"}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {l.performedBy ?? ""} • {fmtDate(l.updatedDate)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="caption" color="text.secondary">
                                #{l.containerLocationLogId}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>{t("order:oldFloor")}: </strong> {l.oldFloor ?? "-"}
                            </Typography>
                            <Typography variant="body2">
                              <strong>{t("order:currentFloor")}: </strong> {l.currentFloor ?? "-"}
                            </Typography>
                            {l.notes ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {l.notes}
                              </Typography>
                            ) : null}

                          
                          </Box>
                        </Box>

                        <Stack spacing={1} alignItems="flex-end">
                          {/* map reason via i18n reason.<value> with fallback to raw */}
                          <Chip label={l.reason ? t(`order:reason.${l.reason}`, { defaultValue: l.reason }) : "-"} size="small" />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigator.clipboard?.writeText(JSON.stringify(l, null, 2))}
                          >
                            {t("order:qr.copy") ?? t("copy") ?? "Copy"}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
