import  { useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";

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

export default function OrderDetailDrawer({ orderCode, open, onClose, orderFull }: Props) {
  const { t } = useTranslation("order");

  const [tabIndex, setTabIndex] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<OrderDetailItem[]>([]);
  const [meta, setMeta] = useState<{ success?: boolean; message?: string }>({});

  const order = orderFull ?? {};

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
                      label={String(headerPaymentStatus)}
                      size="small"
                      color={String(headerPaymentStatus).toLowerCase() === "paid" ? "success" : "warning"}
                      sx={{ fontWeight: 700 }}
                      icon={<PaymentOutlinedIcon sx={{ fontSize: 16 }} />}
                    />
                  )}
                  {has(order?.status) && <Chip label={String(order.status)} size="small" variant="outlined" />}
                  {has(order?.style) && <Chip label={String(order.style)} size="small" variant="outlined" />}
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
                        <Box sx={{ flex: 1 }}>{order.paymentStatus}</Box>
                      </Box>
                    )}

                    {has(order.unpaidAmount) && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.unpaid")}</Box>
                        <Box sx={{ flex: 1, color: "error.main", fontWeight: 700 }}>{fmtMoney(order.unpaidAmount)}</Box>
                      </Box>
                    )}

                    {/* Generic additional fields */}
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
                            ].includes(k)
                        )
                        .map((k) => {
                          const v = order[k];
                          if (!has(v)) return null;
                          return (
                            <Box key={k} sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 140, color: "text.secondary" }}>{k}</Box>
                              <Box sx={{ flex: 1 }}>{String(v)}</Box>
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
                      return (
                        <Card key={d.orderDetailId} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", p: 1.25 }}>
                            {/* thumbnail */}
                            

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography fontWeight={700} noWrap>
                                    {productNames ?? `Item ${d.orderDetailId}`}
                                  </Typography>
                                  {serviceNames && (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {t("item.services")}: {serviceNames}
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

                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1, alignItems: "center" }}>
                                {d.isPlaced != null && <Chip size="small" label={d.isPlaced ? t("item.placed") : t("item.unplaced")} color={d.isPlaced ? "success" : "default"} />}
                                {has(d.containerCode) && <Chip size="small" label={`${t("item.container")}: ${d.containerCode}`} />}
                                {has(d.storageCode) && <Chip size="small" label={`${t("item.storage")}: ${d.storageCode}`} />}
                                {has(d.floorCode) && <Chip size="small" label={`${t("item.floor")}: ${d.floorCode}`} />}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {/* meta message */}
              {meta?.message && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {meta.message}
                  </Typography>
                </Box>
              )}
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

                    {/* generic other customer fields */}
                    {order &&
                      Object.keys(order)
                        .filter((k) => !["customerCode", "customerName", "phoneContact", "customerEmail", "customerAddress"].includes(k))
                        .map((k) => {
                          const v = order[k];
                          if (!has(v)) return null;
                          return (
                            <Box key={k} sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 140, color: "text.secondary" }}>{k}</Box>
                              <Box sx={{ flex: 1 }}>{String(v)}</Box>
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
            <Button variant="contained" color="success">
              {t("actions.markPaid")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
