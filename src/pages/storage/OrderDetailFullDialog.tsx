import React from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  DialogContentText,
  CircularProgress,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

import { translateStatus } from "@/utils/statusHelper";
import { translatePaymentStatus } from "@/utils/paymentStatusHelper";
import { translateServiceName } from "@/utils/translationHelpers";

import { useTranslation } from "react-i18next";

import { updateOrderDetail } from "@/api/orderDetailApi";

type Props = {
  open: boolean;
  data: any | null;
  onClose: () => void;
};

export default function OrderDetailFullDialog({ open, data, onClose }: Props) {
  const { t } = useTranslation([
    "storagePage",
    "statusNames",
    "paymentStatus",
    "orderPanel",
    "common",
    "serviceNames",
  ]);

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const [viewMode, setViewMode] = React.useState<"order" | "customer">("order");
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  React.useEffect(() => {
    if (!open) {
      setViewMode("order");
      setConfirmOpen(false);
      setLoading(false);
    } else {
      // log data for debugging when opened
      // eslint-disable-next-line no-console
      console.log("OrderDetailFullDialog opened - data:", data);
    }
  }, [open, data]);

  if (!data) return null;

  const getLabel = (key: string) => {
    const translated = t(`storagePage:fields.${key}`);
    if (translated === `fields.${key}`) {
      return key
        .replace(/^_/, "")
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return translated;
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return null;

    if (key.toLowerCase().includes("image") && typeof value === "string") {
      return (
        <Box
          component="img"
          src={value}
          alt="img"
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1,
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
        />
      );
    }

    if (["_orderStatus", "orderStatus", "status"].includes(key)) {
      return translateStatus(t, value);
    }

    if (["_orderPaymentStatus", "paymentStatus"].includes(key)) {
      return translatePaymentStatus(t, value);
    }

    if (key === "serviceNames" && Array.isArray(value)) {
      return value.map((s: string) => translateServiceName(t, s)).join(", ");
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : null;
    }

    if (
      typeof value === "number" &&
      (key.toLowerCase().includes("price") ||
        key.toLowerCase().includes("total") ||
        key.toLowerCase().includes("sub"))
    ) {
      return value.toLocaleString() + " đ";
    }

    if (typeof value === "boolean") {
      return value ? t("common.yes") : t("common.no");
    }

    return String(value);
  };

  const entries = Object.entries(data).filter(
    ([_, v]) => v !== null && v !== undefined
  );

  // Determine id for API (prefer orderDetailId if available)
  const findIdFromData = (d: any): number | string | null => {
    if (!d) return null;
    if (d.orderDetailId !== undefined && d.orderDetailId !== null) return d.orderDetailId;
    if (d.id !== undefined && d.id !== null) return d.id;
    if (d._id !== undefined && d._id !== null) return d._id;
    if (d.orderId !== undefined && d.orderId !== null) return d.orderId;
    return null;
  };

  const handleOpenConfirm = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTakeOut = async () => {
    const rawId = findIdFromData(data);
    if (!rawId) {
      showSnackbar(
        (t("storagePage:cannotDetermineId") as string) ||
          "Không xác định được id. Vui lòng kiểm tra data hoặc truyền id từ parent.",
        "error"
      );
      setConfirmOpen(false);
      // eslint-disable-next-line no-console
      console.warn("Cannot determine id from data:", data);
      return;
    }

    // prepare full payload: clone data and set storageCode null
    // strip any client-only fields if needed (e.g. temp keys) - adapt if necessary
    const payload = { ...data, storageCode: null };

    // If there are nested fields or readonly fields the backend doesn't like, you might need to
    // remove them here before sending. Adjust if your API rejects certain fields.
    try {
      setLoading(true);

      // eslint-disable-next-line no-console
      console.log("PUT updateOrderDetail -> id:", rawId, "payload:", payload);

      const resp = await updateOrderDetail(rawId as any, payload);

      // eslint-disable-next-line no-console
      console.log("updateOrderDetail response:", resp);

      // Determine success - backend may return { success: true } or the updated object directly
      const successFlag =
        typeof resp?.success === "boolean" ? resp.success : undefined;

      const returnedObj = resp?.data ?? resp;
      const returnedStorageCode = returnedObj?.storageCode ?? null;

      if (successFlag === true || returnedObj === null || returnedStorageCode == null || returnedStorageCode === "") {
        showSnackbar((t("storagePage:takeOutSuccess") as string) || "Lấy hàng ra thành công!", "success");
        setConfirmOpen(false);
        onClose();
        return;
      }

      // If not updated, try fallback: send storageCode as empty string
      // (some backends ignore null but accept empty string)
      // eslint-disable-next-line no-console
      console.log("Fallback: try sending storageCode as empty string");
      const payload2 = { ...data, storageCode: "" };
      const resp2 = await updateOrderDetail(rawId as any, payload2);
      // eslint-disable-next-line no-console
      console.log("fallback response:", resp2);
      const returnedObj2 = resp2?.data ?? resp2;
      const returnedStorageCode2 = returnedObj2?.storageCode ?? null;

      if (returnedObj2 == null || returnedStorageCode2 == null || returnedStorageCode2 === "") {
        showSnackbar((t("storagePage:takeOutSuccess") as string) || "Lấy hàng ra thành công!", "success");
        setConfirmOpen(false);
        onClose();
        return;
      }

      // final: failed to update
      showSnackbar(
        (t("storagePage:takeOutFailed") as string) ||
          "Lấy hàng ra thất bại. Kiểm tra network/response trong console.",
        "error"
      );
      // eslint-disable-next-line no-console
      console.error("Update did not remove storageCode. resp1:", resp, "resp2:", resp2);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("handleTakeOut error:", err);
      showSnackbar(err?.message || "Có lỗi khi gọi API. Kiểm tra console/network.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        {/* ---------------- HEADER ---------------- */}
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={onClose} size="small">
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>

            <Box>
              <Typography fontWeight={700}>{t("storagePage:orderDetailTitle")}</Typography>

              <Typography variant="body2" color="text.secondary">
                {viewMode === "order" ? t("storagePage:detailInfo") : t("storagePage:customerInfo")}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        {/* ---------------- CONTENT ---------------- */}
        <DialogContent dividers>
          {/* TOP order info */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            flexDirection={isSmUp ? "row" : "column"}
            gap={1}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  width: isSmUp ? 46 : 40,
                  height: isSmUp ? 46 : 40,
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                  fontWeight: 600,
                }}
              >
                {String(data._orderCode ?? data.orderCode ?? "OD").slice(0, 2).toUpperCase()}
              </Avatar>

              <Typography fontWeight={600}>{data._orderCode ?? data.orderCode ?? "-"}</Typography>
            </Box>

            {/* Toggle */}
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title={t("storagePage:viewCustomer")}>
                <IconButton
                  size="small"
                  color={viewMode === "customer" ? "primary" : "default"}
                  onClick={() => setViewMode("customer")}
                >
                  <PersonOutlineRoundedIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={t("storagePage:viewOrder")}>
                <IconButton
                  size="small"
                  color={viewMode === "order" ? "primary" : "default"}
                  onClick={() => setViewMode("order")}
                >
                  <ReceiptLongRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* ---------------- DYNAMIC JSON UI ---------------- */}
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              bgcolor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {entries.map(([key, value]) => {
              const formatted = formatValue(key, value);
              if (!formatted) return null;

              return (
                <Box key={key} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                  <Typography sx={{ width: "40%", fontWeight: 600 }}>{getLabel(key)}</Typography>

                  <Box sx={{ flex: 1 }}>{formatted}</Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>

        {/* ---------------- FOOTER ---------------- */}
        <DialogActions>
          {/* Show button only when storageCode exists */}
          {data?.storageCode != null && (
            <Button
              color="warning"
              variant="contained"
              onClick={handleOpenConfirm}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {loading ? (t("storagePage:processing") as string) || "Đang xử lý..." : (t("storagePage:takeOut") as string) || "Lấy hàng ra"}
            </Button>
          )}

          <Button onClick={onClose}>{t("common.close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
        <DialogTitle>{(t("storagePage:confirmTakeOutTitle") as string) || "Xác nhận"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {(t("storagePage:confirmTakeOutMessage") as string) ||
              "Bạn có chắc muốn lấy hàng ra (set storageCode = null)?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>{(t("common.cancel") as string) || "Hủy"}</Button>
          <Button onClick={handleTakeOut} variant="contained" color="warning" disabled={loading}>
            {loading ? (t("storagePage:processing") as string) || "Đang xử lý..." : (t("storagePage:takeOut") as string) || "Lấy hàng ra"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
