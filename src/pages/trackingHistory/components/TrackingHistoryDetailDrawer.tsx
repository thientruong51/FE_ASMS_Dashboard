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
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ImageIcon from "@mui/icons-material/Image";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import * as trackingApi from "@/api/trackingHistoryApi";
import * as orderStatusApi from "@/api/orderStatusApi";
import { useTranslation } from "react-i18next";

import {
  translateStatus,
  translateActionType,
  translatePaymentStatus,
  translateServiceName,
  translateProductType,
} from "@/utils/translationHelpers";

import { differenceInCalendarDays, parseISO } from "date-fns";

type Props = {
  trackingId: number | null;
  open: boolean;
  onClose: () => void;
  item?: trackingApi.TrackingHistoryItem & Record<string, any>;
  onActionComplete?: () => void;
};

function ConfirmDialog({
  open,
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("trackingHistoryPage");
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title ?? t("confirm")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message ?? t("deleteConfirmMsg")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t("cancelBtn")}
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={16} /> : t("confirmBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TrackingHistoryDetailDrawer({
  trackingId,
  open,
  onClose,
  item,
  onActionComplete,
}: Props) {
  const { t } = useTranslation("trackingHistoryPage");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<trackingApi.TrackingHistoryItem & Record<string, any> | null>(item ?? null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: "success" | "error" | "info"; message: string }>({
    open: false,
    severity: "info",
    message: "",
  });

  const [extendDate, setExtendDate] = useState<Date | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState<string>("");
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  useEffect(() => {
    if (item) {
      setData(item);
      return;
    }
    if (!open || !trackingId) {
      setData(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await trackingApi.getTrackingHistories?.({ page: 1, pageSize: 1000 });
        if (!mounted) return;
        const found = (resp?.data ?? []).find((x: any) => x.trackingHistoryId === trackingId) ?? null;
        setData(found);
      } catch (err) {
        console.error("Failed to fetch tracking item:", err);
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, trackingId, item]);

  useEffect(() => {
    if (item) setData(item);
  }, [item]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  const isChild = useMemo(() => Boolean((data as any)?._isChild), [data]);

  const withTooltip = (original?: string | null, translated?: string | null) => {
    const orig = original ?? "";
    const trans = translated ?? orig ?? "-";
    if (!orig) return <span>{trans}</span>;
    return (
      <Tooltip title={orig}>
        <span
          style={{
            display: "inline-block",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {trans}
        </span>
      </Tooltip>
    );
  };

  const headerTitle = useMemo(() => {
    if (!data) return t("trackingFor", { id: trackingId ?? "" });
    const translatedAction = translateActionType(t, data.actionType ?? "");
    if (translatedAction && translatedAction !== (data.actionType ?? "")) {
      return `${translatedAction} (${data.trackingHistoryId})`;
    }
    return data.actionType ? `${data.actionType} (${data.trackingHistoryId})` : t("trackingFor", { id: data.trackingHistoryId });
  }, [data, trackingId, t]);

  const openSnackbar = (message: string, severity: "success" | "error" | "info" = "info") => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const statusRaw = (data?.newStatus ?? data?.oldStatus ?? "") as string;
  const statusNorm = String(statusRaw).toLowerCase().trim();
  const isCompleted = statusNorm === "completed";
  const overdueAliases = ["overdue", "late", "expired"];

  const isOverdue = overdueAliases.some((a) => statusNorm === a || statusNorm.includes(a));

  const toDateISO = (d: Date | null) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const refreshOrderStatus = async (orderCode: string) => {
    try {
      const resp = await orderStatusApi.getOrderStatus(orderCode);
      const info = resp?.data;
      if (info) {
        setData((d) =>
          d
            ? {
                ...d,
                newStatus: info.status ?? d.newStatus,
                paymentStatus: info.paymentStatus ?? (d as any).paymentStatus,
                returnDate: info.returnDate ?? (d as any).returnDate,
              }
            : d
        );
      }
    } catch (err) {
      console.warn("refreshOrderStatus failed", err);
    }
  };

  const openConfirm = (title: string, message: string, actionFn: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => actionFn);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmOk = async () => {
    if (!confirmAction) {
      setConfirmOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await confirmAction();
      onActionComplete?.();
      onClose();
      openSnackbar(t("confirmActionSuccess"), "success");
    } catch (err) {
      console.error("confirm action failed", err);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    const orderCode = data.orderCode!;
    openConfirm(t("updateStatusConfirmTitle"), t("updateStatusConfirmMsg", { code: orderCode }), async () => {
      const prev = data;
      setData((d) => (d ? { ...d, newStatus } : d));
      try {
        await orderStatusApi.updateStatus(orderCode);
        await refreshOrderStatus(orderCode);
      } catch (err) {
        console.error("Failed to update status:", err);
        openSnackbar(t("saveFailed") ?? "Failed", "error");
        setData(prev);
        throw err;
      }
    });
  };

  const handleExtendOrder = () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    if (!extendDate) {
      openSnackbar(t("selectExtendDate"), "error");
      return;
    }
    const isoDate = toDateISO(extendDate);
    if (!isoDate) {
      openSnackbar(t("invalidDate"), "error");
      return;
    }
    const orderCode = data.orderCode!;

    const fetchOrderInfoIfNeeded = async (): Promise<any | null> => {
      try {
        const hasDeposit = Boolean((data as any)?.depositDate);
        const hasPrice = (data as any)?.totalPrice !== undefined && (data as any).totalPrice !== null;
        if (hasDeposit && hasPrice) {
          return { depositDate: (data as any).depositDate, totalPrice: (data as any).totalPrice, returnDate: (data as any).returnDate };
        }

        const resp = await orderStatusApi.getOrderStatus(orderCode);
        const info = resp && ((resp as any).data !== undefined ? (resp as any).data : resp);
        if (info) {
          setData((d) => {
            if (d) {
              return {
                ...d,
                depositDate: d.depositDate ?? info.depositDate,
                totalPrice: d.totalPrice ?? info.totalPrice,
                returnDate: d.returnDate ?? info.returnDate,
              } as typeof d;
            }

            const minimal: any = {
              trackingHistoryId: trackingId ?? -1,
              orderCode: info?.orderCode ?? orderCode,
              depositDate: info.depositDate ?? null,
              totalPrice: info.totalPrice ?? null,
              returnDate: info.returnDate ?? null,
              oldStatus: (info as any).oldStatus ?? null,
              newStatus: (info as any).newStatus ?? null,
              actionType: (info as any).actionType ?? null,
              createAt: (info as any).createAt ?? null,
            };
            return minimal as trackingApi.TrackingHistoryItem & Record<string, any>;
          });

          return info;
        }

        return null;
      } catch (err) {
        console.warn("[EXTEND] fetchOrderInfoIfNeeded failed:", err);
        return null;
      }
    };

    openConfirm(
      t("extendConfirmTitle"),
      t("extendConfirmMsg", { code: orderCode, date: isoDate }),
      async () => {
        const prev = data;
        const infoFromFetch = await fetchOrderInfoIfNeeded();

        const merged = {
          ...(prev ?? {}),
          ...(data ?? {}),
          ...(infoFromFetch ?? {}),
        };

        const depositStr = merged.depositDate;
        const origReturnStr = merged.returnDate;
        const totalPriceRaw = merged.totalPrice ?? 0;

        let unpaidAmount = 0;

        try {
          if (depositStr && origReturnStr) {
            const deposit = parseISO(String(depositStr));
            const origReturn = parseISO(String(origReturnStr));
            const newReturn = extendDate;

            const originalDays = differenceInCalendarDays(origReturn, deposit);
            const extendDays = differenceInCalendarDays(newReturn, origReturn);

            const totalPrice = Number(totalPriceRaw) || 0;

            if (originalDays > 0 && extendDays > 0 && totalPrice > 0) {
              const perDay = totalPrice / originalDays;
              unpaidAmount = Math.round(perDay * extendDays);
              if (unpaidAmount < 0) unpaidAmount = 0;
            } else {
              unpaidAmount = 0;
            }
          } else {
            unpaidAmount = 0;
          }
        } catch (err) {
          console.error("[EXTEND] compute error:", err);
          unpaidAmount = 0;
        }

        setData((d) => (d ? { ...d, returnDate: isoDate, unpaidAmount } : d));

        try {
          await orderStatusApi.extendOrder(orderCode, isoDate, unpaidAmount);
          await refreshOrderStatus(orderCode);
          openSnackbar(t("confirmActionSuccess"), "success");
        } catch (err) {
          console.error("[EXTEND] API CALL failed:", err);
          openSnackbar(t("saveFailed"), "error");
          setData(prev);
          throw err;
        }
      }
    );
  };

  const handleMoveToExpiredStorage = () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    const orderCode = data.orderCode!;
    openConfirm(t("moveExpiredConfirmTitle"), t("moveExpiredConfirmMsg", { code: orderCode }), async () => {
      const prev = data;
      setData((d) => (d ? { ...d, newStatus: "Expired" } : d));
      try {
        await orderStatusApi.moveToExpiredStorage(orderCode);
        await refreshOrderStatus(orderCode);
      } catch (err) {
        console.error("Failed to move to expired storage:", err);
        openSnackbar(t("saveFailed"), "error");
        setData(prev);
        throw err;
      }
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 640, md: 700 } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                    {headerTitle}
                  </Typography>
                  {loading && <CircularProgress size={16} />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {t("subtitle")}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton onClick={onClose} size="small">
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
            <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "#eef2ff", color: "primary.main" }}>
                <VisibilityRoundedIcon />
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{withTooltip(data?.actionType ?? "", translateActionType(t, data?.actionType ?? ""))}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("created")}: {data?.createAt ?? "-"}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
                {has(data?.currentAssign) && <Chip label={`${t("currentAssign") ?? "From"}: ${data?.currentAssign}`} size="small" />}
                {has(data?.nextAssign) && <Chip label={`${t("nextAssign") ?? "To"}: ${data?.nextAssign}`} size="small" />}
              </Box>
            </Box>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  {has(data?.trackingHistoryId) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("id")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.trackingHistoryId}</Box>
                    </Box>
                  )}

                  {has(data?.orderCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("order")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderCode}</Box>
                    </Box>
                  )}

                  {has(data?.orderDetailCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("orderDetail")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderDetailCode}</Box>
                    </Box>
                  )}

                  {has(data?.oldStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("oldStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.oldStatus ?? "", translateStatus(t, data?.oldStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.newStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("newStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.newStatus ?? "", translateStatus(t, data?.newStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.paymentStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("paymentStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.paymentStatus ?? "", translatePaymentStatus(t, data?.paymentStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.serviceName) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("service")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.serviceName ?? "", translateServiceName(t, data?.serviceName ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.productType) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("productType")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.productType ?? "", translateProductType(t, data?.productType ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.image) ? (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("image")}</Box>
                      <Box sx={{ flex: 1 }}>
                        <img src={String(data?.image)} alt={t("imageAlt")} style={{ maxWidth: "100%", borderRadius: 8 }} />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("image")}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ImageIcon fontSize="small" />
                          <Typography color="text.secondary">{t("noImage")}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {data &&
                    Object.keys(data)
                      .filter(
                        (k) =>
                          ![
                            "trackingHistoryId",
                            "orderCode",
                            "orderDetailCode",
                            "oldStatus",
                            "newStatus",
                            "actionType",
                            "createAt",
                            "currentAssign",
                            "nextAssign",
                            "image",
                            "_isChild",
                          ].includes(k)
                      )
                      .map((k) => {
                        const v = (data as any)[k];
                        if (!has(v)) return null;
                        return (
                          <Box key={k} sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{k}</Box>
                            <Box sx={{ flex: 1 }}>{String(v)}</Box>
                          </Box>
                        );
                      })}
                </Stack>
              </CardContent>
            </Card>

            <Box sx={{ mb: 2 }}>
              {/* If this item is a child entry (inside the dropdown), hide action buttons */}
              {!isChild && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {isOverdue ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DatePicker
                          label={t("newReturnDateLabel")}
                          value={extendDate}
                          onChange={(d: Date | null) => setExtendDate(d)}
                          slotProps={{ textField: { size: "small" } as any }}
                        />
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleExtendOrder}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={16} /> : null}
                      >
                        {t("extendOrder")}
                      </Button>

                      <Button variant="outlined" size="small" onClick={handleMoveToExpiredStorage} disabled={actionLoading}>
                        {t("moveToExpired")}
                      </Button>
                    </>
                  ) : (
                    <Button variant="contained" size="small" onClick={() => handleUpdateStatus("SomeNewStatus")} disabled={actionLoading || isCompleted}>
                      {t("updateStatus")}
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
            <Box />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                {t("close")}
              </Button>
            </Box>
          </Box>
        </Box>

        <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} loading={actionLoading} onCancel={handleConfirmCancel} onConfirm={handleConfirmOk} />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Drawer>
    </LocalizationProvider>
  );
}
