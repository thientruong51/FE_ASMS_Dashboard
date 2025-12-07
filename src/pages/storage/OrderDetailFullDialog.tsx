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
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

import { translateStatus } from "@/utils/statusHelper";
import { translatePaymentStatus } from "@/utils/paymentStatusHelper";
import { translateServiceName } from "@/utils/translationHelpers";

import { useTranslation } from "react-i18next";

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

  React.useEffect(() => {
    if (!open) setViewMode("order");
  }, [open]);

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

  const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* ---------------- HEADER ---------------- */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={onClose} size="small">
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>

          <Box>
            <Typography fontWeight={700}>
              {t("storagePage:orderDetailTitle")}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {viewMode === "order"
                ? t("storagePage:detailInfo")
                : t("storagePage:customerInfo")}
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
              {String(data._orderCode ?? data.orderCode ?? "OD")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>

            <Typography fontWeight={600}>
              {data._orderCode ?? data.orderCode ?? "-"}
            </Typography>
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
              <Box
                key={key}
                sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
              >
                <Typography sx={{ width: "40%", fontWeight: 600 }}>
                  {getLabel(key)}
                </Typography>

                <Box sx={{ flex: 1 }}>{formatted}</Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      {/* ---------------- FOOTER ---------------- */}
      <DialogActions>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
