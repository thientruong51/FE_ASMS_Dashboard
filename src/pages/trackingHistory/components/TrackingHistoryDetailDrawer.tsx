// src/pages/TrackingHistory/components/TrackingHistoryDetailDrawer.tsx
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

type Props = {
  trackingId: number | null;
  open: boolean;
  onClose: () => void;
  item?: trackingApi.TrackingHistoryItem;
  onActionComplete?: () => void;
};

/**
 * Small reusable confirm dialog used across actions.
 */
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
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title ?? "Xác nhận"}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message ?? "Bạn có chắc?"}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={16} /> : "Xác nhận"}
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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // for button actions
  const [data, setData] = useState<trackingApi.TrackingHistoryItem | null>(item ?? null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: "success" | "error" | "info"; message: string }>(
    { open: false, severity: "info", message: "" }
  );

  // For extend order date picker
  const [extendDate, setExtendDate] = useState<Date | null>(null);

  // Confirm dialog state
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

  const headerTitle = useMemo(() => {
    if (!data) return `Tracking #${trackingId ?? ""}`;
    return data.actionType ? `${data.actionType} (${data.trackingHistoryId})` : `Tracking #${data.trackingHistoryId}`;
  }, [data, trackingId]);

  const openSnackbar = (message: string, severity: "success" | "error" | "info" = "info") =>
    setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // normalize status string from either newStatus or oldStatus
  const statusRaw = (data?.newStatus ?? data?.oldStatus ?? "") as string;
  const statusNorm = String(statusRaw).toLowerCase().trim();

  // aliases — extend if backend returns different labels (e.g. Vietnamese)
  const overdueAliases = ["overdue", "late", "expired"];
  const retrievedAliases = ["retrieved", "returned"];

  const isOverdue = overdueAliases.some((a) => statusNorm === a || statusNorm.includes(a));
  const isRetrieved = retrievedAliases.some((a) => statusNorm === a || statusNorm.includes(a));

  // Helper to format date to yyyy-mm-dd
  const toDateISO = (d: Date | null) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Refresh order status from orderStatusApi and merge into data
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

  // Generic: open confirm dialog with an async action to run on confirm
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

  // will close drawer after successful action
  const handleConfirmOk = async () => {
    if (!confirmAction) {
      setConfirmOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await confirmAction();
      // after success: notify parent to reload data
      onActionComplete?.();
      // close drawer automatically as requested
      onClose();
      openSnackbar("Hành động thực hiện thành công.", "success");
    } catch (err) {
      console.error("confirm action failed", err);
      // keep drawer open so user can retry / see error
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  // Update order status (generic)
  const handleUpdateStatus = (newStatus: string) => {
    if (!data?.orderCode) {
      openSnackbar("Order code missing.", "error");
      return;
    }
    const orderCode = data.orderCode!; // assert non-null after check
    openConfirm(
      "Cập nhật trạng thái",
      `Bạn có chắc muốn cập nhật trạng thái đơn ${orderCode}?`,
      async () => {
        const prev = data;
        setData((d) => (d ? { ...d, newStatus } : d));
        try {
          await orderStatusApi.updateStatus(orderCode);
          await refreshOrderStatus(orderCode);
        } catch (err) {
          console.error("Failed to update status:", err);
          openSnackbar("Cập nhật trạng thái thất bại.", "error");
          setData(prev); // revert
          throw err;
        }
      }
    );
  };

  // Extend order: requires selecting a newReturnDate
  const handleExtendOrder = () => {
    if (!data?.orderCode) {
      openSnackbar("Order code missing.", "error");
      return;
    }
    if (!extendDate) {
      openSnackbar("Vui lòng chọn ngày muốn gia hạn (new return date).", "error");
      return;
    }
    const isoDate = toDateISO(extendDate);
    if (!isoDate) {
      openSnackbar("Ngày không hợp lệ.", "error");
      return;
    }

    const orderCode = data.orderCode!; // assert non-null
    openConfirm(
      "Gia hạn đơn",
      `Gia hạn đơn ${orderCode} đến ngày ${isoDate}?`,
      async () => {
        const prev = data;
        setData((d) => (d ? { ...d, returnDate: isoDate } : d));
        try {
          await orderStatusApi.extendOrder(orderCode, isoDate);
          await refreshOrderStatus(orderCode);
        } catch (err) {
          console.error("Failed to extend order:", err);
          openSnackbar("Gia hạn thất bại.", "error");
          setData(prev);
          throw err;
        }
      }
    );
  };

  // Move to expired storage - BE only needs orderCode
  const handleMoveToExpiredStorage = () => {
    if (!data?.orderCode) {
      openSnackbar("Order code missing.", "error");
      return;
    }
    const orderCode = data.orderCode!; // assert non-null
    openConfirm(
      "Chuyển kho hết hạn",
      `Chuyển đơn ${orderCode} vào kho hết hạn?`,
      async () => {
        const prev = data;
        setData((d) => (d ? { ...d, newStatus: "Expired" } : d));
        try {
          await orderStatusApi.moveToExpiredStorage(orderCode);
          await refreshOrderStatus(orderCode);
        } catch (err) {
          console.error("Failed to move to expired storage:", err);
          openSnackbar("Chuyển kho thất bại.", "error");
          setData(prev);
          throw err;
        }
      }
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 640, md: 760 } } }}>
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
                  Tracking history details
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
                <Typography fontWeight={700}>{data?.actionType ?? "-"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Created: {data?.createAt ?? "-"}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
                {has(data?.currentAssign) && <Chip label={`From: ${data?.currentAssign}`} size="small" />}
                {has(data?.nextAssign) && <Chip label={`To: ${data?.nextAssign}`} size="small" />}
                {has(statusRaw) && <Chip label={`Status: ${statusRaw}`} size="small" />}
              </Box>
            </Box>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  {has(data?.trackingHistoryId) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>ID</Box>
                      <Box sx={{ flex: 1 }}>{data?.trackingHistoryId}</Box>
                    </Box>
                  )}

                  {has(data?.orderCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>Order</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderCode}</Box>
                    </Box>
                  )}

                  {has(data?.orderDetailCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>Order Detail</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderDetailCode}</Box>
                    </Box>
                  )}

                  {has(data?.oldStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>Old Status</Box>
                      <Box sx={{ flex: 1 }}>{data?.oldStatus}</Box>
                    </Box>
                  )}

                  {has(data?.newStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>New Status</Box>
                      <Box sx={{ flex: 1 }}>{data?.newStatus}</Box>
                    </Box>
                  )}

                  {/* image */}
                  {has(data?.image) ? (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>Image</Box>
                      <Box sx={{ flex: 1 }}>
                        <img src={String(data?.image)} alt="tracking" style={{ maxWidth: "100%", borderRadius: 8 }} />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>Image</Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ImageIcon fontSize="small" />
                          <Typography color="text.secondary">No image</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* fallback display other fields */}
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

            {/* ACTION AREA */}
            <Box sx={{ mb: 2 }}>
              {!isRetrieved && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* If Overdue: show date picker + extend + move to expired */}
                  {isOverdue ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DatePicker
                          label="New return date"
                          value={extendDate}
                          onChange={(d: Date | null) => setExtendDate(d)}
                          slotProps={{
                            textField: {
                              size: "small",
                            } as any,
                          }}
                        />
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleExtendOrder}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={16} /> : null}
                      >
                        Extend order
                      </Button>

                      <Button variant="outlined" size="small" onClick={handleMoveToExpiredStorage} disabled={actionLoading}>
                        Move to expired storage
                      </Button>
                    </>
                  ) : (
                    // non-overdue & non-retrieved: generic updateStatus button
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUpdateStatus("SomeNewStatus")}
                        disabled={actionLoading}
                      >
                        Update status
                      </Button>
                    </>
                  )}
                </Stack>
              )}
              {isRetrieved && (
                <Typography variant="body2" color="text.secondary">
                  Đơn đã được trả (Retrieved). Không có hành động nào khả dụng.
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              gap: 1,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Confirm dialog */}
        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          loading={actionLoading}
          onCancel={handleConfirmCancel}
          onConfirm={handleConfirmOk}
        />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Drawer>
    </LocalizationProvider>
  );
}
