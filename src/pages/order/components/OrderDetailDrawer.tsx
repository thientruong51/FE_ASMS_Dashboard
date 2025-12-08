import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Button,
  Tooltip,
  Card,
  CardContent,
  Tabs,
  Tab,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import orderApi, { type OrderDetailItem } from "@/api/orderApi";
import { getContainerTypes } from "@/api/containerTypeApi";
import shelfTypeApi from "@/api/shelfTypeApi";
import { useTranslation } from "react-i18next";

import {
  translateStatus,
  translatePaymentStatus,
  translateServiceName,
  translateProductType,
  translateStyle,
} from "@/utils/translationHelpers";


const CONTAINER_TYPES_FALLBACK = [
  { containerTypeId: 1, type: "A", length: 0.5, width: 0.5, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103944/THUNG_A_s6rirx.glb", price: 35000 },
  { containerTypeId: 2, type: "B", length: 0.75, width: 0.75, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103945/THUNG_B_r3eikp.glb", price: 50000 },
  { containerTypeId: 3, type: "C", length: 1, width: 0.5, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_C_cbsgav.glb", price: 60000 },
  { containerTypeId: 4, type: "D", length: 0.5, width: 0.5, height: 0.8, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_D_ognjqr.glb", price: 55000 },
  { containerTypeId: 5, type: "A", length: 0.5, width: 0.5, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847449/THUNG_A_uu6f3w.glb", price: 25000 },
  { containerTypeId: 6, type: "B", length: 0.75, width: 0.75, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847443/THUNG_B_qp8ysr.glb", price: 35000 },
  { containerTypeId: 7, type: "C", length: 1, width: 0.5, height: 0.45, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847443/THUNG_C_wtagvu.glb", price: 40000 },
  { containerTypeId: 8, type: "D", length: 0.5, width: 0.5, height: 0.8, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847446/THUNG_D_cs1w1m.glb", price: 38000 },
];

const SHELF_TYPES_FALLBACK = [
  { shelfTypeId: 1, name: "Shelf", length: 1.55, width: 1.06, height: 2.45, price: 150000, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847444/KE_1550X1057X2045_jvuubl.glb" },
  { shelfTypeId: 2, name: "Shelf_Logistics", length: 1.7, width: 1.07, height: 5.2, price: 0, imageUrl: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847452/KE_1700X1070X6200_s2s3ey.glb" },
];

type Props = {
  orderCode: string | null;
  open: boolean;
  onClose: () => void;
  orderFull?: Record<string, any> | null;
};

function a11yProps(index: number) {
  return {
    id: `order-tab-${index}`,
    "aria-controls": `order-tabpanel-${index}`,
  };
}

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
        boxShadow: 0,
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
          <Thumbnail key={i} src={src} size={152} />
        ))}
        {others.length > 0 && <span>{others.join(", ")}</span>}
      </Box>
    );
  }

  if (typeof v === "string" && isImageUrl(v)) {
    return <Thumbnail src={v} size={56} />;
  }

  if (typeof v === "object") {
    try {
      return String(JSON.stringify(v));
    } catch {
      return String(v);
    }
  }

  return String(v);
};

export default function OrderDetailDrawer({ orderCode, open, onClose, orderFull }: Props) {
  const { t } = useTranslation("order");

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<OrderDetailItem[]>([]);
  const [, setMeta] = useState<{ success?: boolean; message?: string }>({});

  const [containerMap, setContainerMap] = useState<Record<number, any>>({});
  const [shelfMap, setShelfMap] = useState<Record<number, any>>({});

  const order = orderFull ?? {};

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const containersResp = await getContainerTypes();
        const containers = Array.isArray(containersResp) ? containersResp :  containersResp;
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
    if (!open || !orderCode) {
      setDetails([]);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await orderApi.getOrderDetails(orderCode);
        if (!mounted) return;
        setDetails(resp.data ?? []);
        setMeta({ success: (resp as any).success, message: (resp as any).message });
      } catch (err) {
        console.error("getOrderDetails failed", err);
        if (!mounted) return;
        setDetails([]);
        setMeta({ success: false, message: (err as any)?.message ?? t("messages.loadFailed") });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, orderCode, t]);

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
      const d = new Date(v);
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
      return `${type} `;
    }
    return String(val);
  };

  const getShelfLabel = (val: number | string | undefined | null) => {
    if (val == null || val === "") return null;
    const id = typeof val === "number" ? val : /^\d+$/.test(String(val)) ? Number(val) : NaN;
    if (!Number.isNaN(id) && shelfMap[id]) {
      const s = shelfMap[id];
      const name = s.name ?? s.type ?? `#${id}`;
      return `${name} `;
    }
    return String(val);
  };

  const headerCustomer = useMemo(
    () => order?.customerName ?? order?.customer ?? order?.customerCode ?? null,
    [order]
  );
  const headerDepositDate = useMemo(() => order?.depositDate ?? order?.orderDate ?? null, [order]);
  const headerReturnDate = useMemo(() => order?.returnDate ?? null, [order]);
  const headerPaymentStatus = useMemo(() => order?.paymentStatus ?? null, [order]);
  const headerTotal = useMemo(() => (order?.totalPrice != null ? order.totalPrice : null), [order]);

  useEffect(() => {
    if (open) setTabIndex(0);
  }, [open]);

  const withTooltip = (original?: string | null, translated?: string | null) => {
    const orig = original ?? "";
    const trans = translated ?? orig ?? "-";
    if (!orig) return <span>{trans}</span>;
    return (
      <Tooltip title={orig}>
        <span style={{ display: "inline-block", maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {trans}
        </span>
      </Tooltip>
    );
  };

  const headerPaymentTranslated = translatePaymentStatus(t, String(headerPaymentStatus ?? ""));
  const headerStatusTranslated = translateStatus(t, String(order?.status ?? ""));
  const headerStyleTranslated = translateStyle(t, String(order?.style ?? ""));

  const labelFor = (k: string) => {
    const i18nKey = `labels.${k}`;
    const looked = t(i18nKey);
    if (looked && looked !== i18nKey) return looked;
    return k
      .replace(/([A-Z])/g, " $1")
      .replace(/[_\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (s) => s.toUpperCase());
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 900 } } }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Box>
              <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                {t("labels.order")} {orderCode ?? ""}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                {t("page.clickToView")}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* Tabs control icons for quick access */}
            <Tooltip title={t("tabs.order")}>
              <IconButton size="small" color={tabIndex === 0 ? "primary" : "default"} onClick={() => setTabIndex(0)}>
                <ReceiptLongRoundedIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={t("tabs.customer")}>
              <IconButton size="small" color={tabIndex === 1 ? "primary" : "default"} onClick={() => setTabIndex(1)}>
                <PersonOutlineRoundedIcon />
              </IconButton>
            </Tooltip>

            <IconButton onClick={onClose} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Tabs */}
        <Box sx={{ px: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="order tabs">
            <Tab label={t("tabs.order")} {...a11yProps(0)} />
            <Tab label={t("tabs.customer")} {...a11yProps(1)} />
          </Tabs>
        </Box>

        <Divider />

        {/* Content */}
        <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
          {/* Summary top (always visible) */}
          <Box sx={{ mb: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", minWidth: 0 }}>
              <Avatar sx={{ width: 64, height: 64, fontWeight: 700, bgcolor: "#e8f0ff", color: "primary.main" }}>
                {headerCustomer ? String(headerCustomer).slice(0, 2).toUpperCase() : "OD"}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} sx={{ fontSize: 16, lineHeight: 1 }}>
                  {headerCustomer ?? orderCode}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                  {has(headerPaymentStatus) && (
                    <Chip
                      label={withTooltip(String(headerPaymentStatus), headerPaymentTranslated)}
                      size="small"
                      color={String(headerPaymentStatus).toLowerCase() === "paid" ? "success" : "warning"}
                      sx={{ fontWeight: 700 }}
                      icon={<PaymentOutlinedIcon sx={{ fontSize: 16 }} />}
                    />
                  )}
                  {has(order?.status) && <Chip label={withTooltip(String(order.status), headerStatusTranslated)} size="small" variant="outlined" />}
                  {has(order?.style) && <Chip label={withTooltip(String(order.style), headerStyleTranslated)} size="small" variant="outlined" />}
                </Stack>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              {has(headerTotal) && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    {t("labels.total")}
                  </Typography>
                  <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                    {fmtMoney(headerTotal)}
                  </Typography>
                </>
              )}
              <Box sx={{ mt: 1 }}>
                {has(headerDepositDate) && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("labels.depositDate")}:</strong> {fmtDate(headerDepositDate)}
                  </Typography>
                )}
                {has(headerReturnDate) && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t("labels.returnDate")}:</strong> {fmtDate(headerReturnDate)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tab panels */}
          {tabIndex === 0 && (
            <Box role="tabpanel" id="order-tabpanel-0" aria-labelledby="order-tab-0">
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {t("labels.orderInformation")}
              </Typography>

              <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <CardContent>
                  <Stack spacing={1}>
                    {has(order.orderCode) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.orderId")}</Box>
                        <Box sx={{ flex: 1 }}>{order.orderCode}</Box>
                      </Box>
                    )}

                    {has(order.orderDate) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.orderDate")}</Box>
                        <Box sx={{ flex: 1 }}>{fmtDate(order.orderDate)}</Box>
                      </Box>
                    )}

                    {has(order.depositDate) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.depositDate")}</Box>
                        <Box sx={{ flex: 1 }}>{fmtDate(order.depositDate)}</Box>
                      </Box>
                    )}

                    {has(order.returnDate) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.returnDate")}</Box>
                        <Box sx={{ flex: 1 }}>{fmtDate(order.returnDate)}</Box>
                      </Box>
                    )}

                    {has(order.paymentStatus) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.payment")}</Box>
                        <Box sx={{ flex: 1 }}>{withTooltip(String(order.paymentStatus), translatePaymentStatus(t, String(order.paymentStatus)))}</Box>
                      </Box>
                    )}

                    {has(order.unpaidAmount) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.unpaid")}</Box>
                        <Box sx={{ flex: 1, color: "error.main", fontWeight: 700 }}>{fmtMoney(order.unpaidAmount)}</Box>
                      </Box>
                    )}
                    {has(order.style) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("table.style")}</Box>
                        <Box sx={{ flex: 1 }}>
                          {withTooltip(String(order.style), translateStyle(t, String(order.style)))}
                        </Box>
                      </Box>
                    )}

                    {/* Generic additional fields — use i18n labels.* fallback humanized */}
                    {order &&
                      Object.keys(order)
                        .filter(
                          (k) =>
                            ![
                              "orderCode",
                              "orderDate",
                              "depositDate",
                              "returnDate",
                              "status",
                              "paymentStatus",
                              "totalPrice",
                              "unpaidAmount",
                              "customerCode",
                              "customerName",
                              "style",
                            ].includes(k)
                        )
                        .map((k) => {
                          const v = order[k];
                          if (!has(v)) return null;

                          return (
                            <Box key={k} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                              <Box sx={{ width: 140, color: "text.secondary" }}>{labelFor(k)}</Box>
                              <Box sx={{ flex: 1 }}>{renderValue(v)}</Box>
                            </Box>
                          );
                        })}
                  </Stack>
                </CardContent>
              </Card>

              {/* Items list */}
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {t("labels.items")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {loading ? t("labels.loading") : t("page.itemsCount", { count: details.length })}
                  </Typography>
                </Box>

                {loading ? (
                  <Typography color="text.secondary">{t("labels.loadingItems")}</Typography>
                ) : details.length === 0 ? (
                  <Typography color="text.secondary">{t("labels.noItems")}</Typography>
                ) : (
                  <Stack spacing={1}>
                    {details.map((d) => {
                      const productNames = joinIfArray((d as any).productTypeNames);
                      const serviceNames = joinIfArray((d as any).serviceNames);

                      const productTranslated = productNames
                        ? productNames
                          .split(",")
                          .map((x) => translateProductType(t, x.trim()))
                          .join(", ")
                        : null;
                      const serviceTranslated = serviceNames
                        ? serviceNames
                          .split(",")
                          .map((x) => translateServiceName(t, x.trim()))
                          .join(", ")
                        : null;

                      const possibleImageFields = [
                        (d as any).image,
                        (d as any).imageUrl,
                        (d as any).photo,
                        (d as any).thumbnail,
                        (d as any).photoUrl,
                        (d as any).images,
                      ];

                      const imageCandidates = ([] as any[]).concat(...possibleImageFields.filter(Boolean));

                      const containerLabel = getContainerLabel((d as any).containerType);
                      const shelfLabel = getShelfLabel((d as any).shelfTypeId);

                      return (
                        <Card key={d.orderDetailId} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", p: 1.25 }}>
                            {/* left: thumbnail column (if any) */}
                            {imageCandidates && imageCandidates.length > 0 ? (
                              <Box sx={{ mr: 1, display: "flex", gap: 1, flexDirection: "column" }}>
                                {imageCandidates.slice(0, 3).map((src, i) =>
                                  isImageUrl(src) ? <Thumbnail key={i} src={src} size={152} /> : null
                                )}
                              </Box>
                            ) : null}

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography fontWeight={700} noWrap>
                                    {productNames ?? `Item ${d.orderDetailId}`}
                                  </Typography>
                                  {serviceNames && (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {t("item.services")}: {withTooltip(serviceNames, serviceTranslated)}
                                    </Typography>
                                  )}
                                </Box>

                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                  <Typography fontWeight={700}>{fmtMoney(d.subTotal ?? d.price)}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {d.quantity != null ? `${t("item.qty")}: ${d.quantity}` : ""}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* chips: hiện mọi field có dữ liệu, và map container/shelf thành label nếu có */}
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1, alignItems: "center" }}>
                                {d.isPlaced != null && <Chip size="small" label={d.isPlaced ? t("item.placed") : t("item.unplaced")} color={d.isPlaced ? "success" : "default"} />}

                                {has(d.containerCode) && <Chip size="small" label={`${t("item.container")}: ${d.containerCode}`} />}
                                {has(d.storageCode) && <Chip size="small" label={`${t("item.storage")}: ${d.storageCode}`} />}
                                {has(d.floorCode) && <Chip size="small" label={`${t("item.floor")}: ${d.floorCode}`} />}

                                {containerLabel ? (
                                  <Chip size="small" label={`${t("item.containerType")}: ${containerLabel}`} color="info" />
                                ) : (d as any).containerType !== null && (d as any).containerType !== undefined ? (
                                  <Chip size="small" label={`${t("item.containerType")}: ${(d as any).containerType}`} color="info" />
                                ) : null}

                                {shelfLabel ? (
                                  <Chip size="small" label={`${t("item.shelfType")}: ${shelfLabel}`} color="warning" />
                                ) : (d as any).shelfTypeId !== null && (d as any).shelfTypeId !== undefined ? (
                                  <Chip size="small" label={`${t("item.shelfType")}: ${(d as any).shelfTypeId}`} color="warning" />
                                ) : null}


                                {has((d as any).length) && <Chip size="small" label={`L: ${(d as any).length}`} />}
                                {has((d as any).width) && <Chip size="small" label={`W: ${(d as any).width}`} />}
                                {has((d as any).height) && <Chip size="small" label={`H: ${(d as any).height}`} />}

                                {productNames && <Chip size="small" label={withTooltip(productNames, productTranslated)} />}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          )}

          {tabIndex === 1 && (
            <Box role="tabpanel" id="order-tabpanel-1" aria-labelledby="order-tab-1">
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {t("labels.customerInformation")}
              </Typography>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={1}>
                    {has(order.customerCode) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.code")}</Box>
                        <Box sx={{ flex: 1, fontWeight: 700 }}>{order.customerCode}</Box>
                      </Box>
                    )}

                    {has(order.customerName) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.name")}</Box>
                        <Box sx={{ flex: 1 }}>{order.customerName}</Box>
                      </Box>
                    )}

                    {has(order.phoneContact) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.phone")}</Box>
                        <Box sx={{ flex: 1 }}>{order.phoneContact}</Box>
                      </Box>
                    )}

                    {has(order.customerEmail) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.email")}</Box>
                        <Box sx={{ flex: 1 }}>{order.customerEmail}</Box>
                      </Box>
                    )}

                    {has(order.customerAddress) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.address")}</Box>
                        <Box sx={{ flex: 1 }}>{order.customerAddress}</Box>
                      </Box>
                    )}

                    {/* generic other customer fields — use i18n labels.* fallback humanized */}
                    {order &&
                      Object.keys(order)
                        .filter((k) => !["customerCode", "customerName", "phoneContact", "customerEmail", "customerAddress"].includes(k))
                        .map((k) => {
                          const v = order[k];
                          if (!has(v)) return null;
                          return (
                            <Box key={k} sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 140, color: "text.secondary" }}>{labelFor(k)}</Box>
                              <Box sx={{ flex: 1 }}>{renderValue(v)}</Box>
                            </Box>
                          );
                        })}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        {/* Footer actions */}
        <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Button variant="outlined" size="small" startIcon={<PlaceOutlinedIcon />}>
              {t("actions.locate")}
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={onClose}>
              {t("actions.close")}
            </Button>

          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
