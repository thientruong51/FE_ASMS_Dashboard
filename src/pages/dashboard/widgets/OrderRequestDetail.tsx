import {
  Box,
  Typography,
  Divider,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  translateStatus,
  translatePaymentStatus,
  translateServiceName,
  translateProductType,
} from "@/utils/translationHelpers";

type OrderDetailRow = {
  orderDetailId: number;
  containerCode?: string | null;
  floorCode?: string | null;
  price?: number | null;
  quantity?: string | number | null;
  subTotal?: number | null;
  image?: string | null;
  containerType?: number | null;
  isPlaced?: boolean | null;
  productTypeNames?: string[];
  serviceNames?: string[];
};

type Props = {
  data: {
    id?: string;
    customer?: string;
    location?: string;
    destination?: string;
    date?: string;
    rawOrder?: any;
    orderDetails?: OrderDetailRow[];
    orderMeta?: { success?: boolean; message?: string };
  } | null;
  onClose: () => void;
};

export default function OrderRequestDetail({ data, onClose }: Props) {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [viewMode, setViewMode] = useState<"order" | "customer">("order");

  if (!data) return null;

  const details: OrderDetailRow[] = data.orderDetails ?? [];

  const fmt = (v: any) => (v ?? t("noData"));

  const formatCurrency = (v: number | undefined | null) =>
    typeof v === "number" ? `${v.toLocaleString()}đ` : t("noData");

  return (
    <Box sx={{ width: "100%" }}>
      {/* ===== HEADER ===== */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Box>
            <Typography fontWeight={600} fontSize={16}>
              {t("orderRequest.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
              {viewMode === "order" ? t("orderRequest.orderDetails") : t("orderRequest.customerDetails")}
            </Typography>
          </Box>
        </Box>

        {/* Right side icons */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title={t("orderRequest.viewCustomer")}>
            <IconButton
              size="small"
              color={viewMode === "customer" ? "primary" : "default"}
              onClick={() => setViewMode("customer")}
            >
              <PersonOutlineRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={t("orderRequest.viewOrder")}>
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

      <Divider sx={{ mb: 2 }} />

      {/* ===== CUSTOMER HEADER ===== */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Box display="flex" alignItems="center" gap={1.25}>
          <Avatar
            sx={{
              width: { xs: 52, sm: 46 },
              height: { xs: 52, sm: 46 },
              bgcolor: "#e3f2fd",
              color: "#1976d2",
              fontWeight: 600,
            }}
          >
            {String((data.customer ?? "C").slice(0, 2)).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={600} fontSize={isXs ? 15 : 16}>
              {fmt(data.customer ?? data.rawOrder?.customerCode)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
              {fmt(data.rawOrder?.companyName ?? t("orderRequest.customerInfo"))}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1} width={isXs ? "100%" : "auto"} justifyContent={isXs ? "space-between" : "flex-end"}>
          <Button
            variant="contained"
            size={isXs ? "medium" : "small"}
            sx={{ textTransform: "none", minWidth: 100, flex: isXs ? 1 : "unset" }}
            onClick={() => {
            }}
          >
            {t("orderRequest.accept")}
          </Button>
          <Button
            variant="outlined"
            size={isXs ? "medium" : "small"}
            sx={{ textTransform: "none", minWidth: 100, flex: isXs ? 1 : "unset" }}
            onClick={() => {
            }}
          >
            {t("orderRequest.reject")}
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, textAlign: "right", mb: 2 }}>
        {fmt(data.date ?? data.rawOrder?.orderDate)}
      </Typography>

      {/* ===== BODY: SWITCH VIEW ===== */}
      {viewMode === "order" ? (
        <Box>
          <Typography fontWeight={600} mb={1}>
            {t("orderRequest.orderDetails")}
          </Typography>

          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: { xs: 1.25, sm: 2 }, bgcolor: "#fff" }}>
            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.orderId")}</Typography>
              <Typography variant="body2">{fmt(data.id)}</Typography>
            </Box>

            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.orderPlacedOn")}</Typography>
              <Typography variant="body2">{fmt(data.date ?? data.rawOrder?.orderDate)}</Typography>
            </Box>

            <Box mb={1.25} display="flex" flexDirection={isXs ? "column" : "row"} gap={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} fontWeight={600}>{t("orderRequest.status")}</Typography>
                <Typography variant="body2">
                  {translateStatus(t, data.rawOrder?.status)}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} fontWeight={600}>{t("orderRequest.paymentStatus")}</Typography>
                <Typography variant="body2">
                  {translatePaymentStatus(t, data.rawOrder?.paymentStatus)}
                </Typography>
              </Box>
            </Box>

            <Box mb={1.25} display="flex" flexDirection={isXs ? "column" : "row"} gap={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} fontWeight={600}>{t("orderRequest.pickupAddress")}</Typography>
                <Typography variant="body2">{fmt(data.location ?? data.rawOrder?.pickupAddress)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} fontWeight={600}>{t("orderRequest.deliveryAddress")}</Typography>
                <Typography variant="body2">{fmt(data.destination ?? data.rawOrder?.deliveryAddress)}</Typography>
              </Box>
            </Box>

            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.total")}</Typography>
              <Typography variant="body2">
                {formatCurrency(data.rawOrder?.totalPrice)}
              </Typography>
            </Box>

            <Box>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.items")}</Typography>
              {details.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t("orderRequest.noItems")}</Typography>
              ) : (
                details.map((d) => (
                  <Box key={d.orderDetailId} sx={{ border: "1px solid #f1f1f1", borderRadius: 1, p: 1, mb: 1 }}>
                    <Typography fontWeight={600} fontSize={13}>
                      {/* translate product types */}
                      {d.productTypeNames?.map((p) => translateProductType(t, p)).join(", ") ?? `${t("orderRequest.item")} #${d.orderDetailId}`}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {t("orderRequest.quantity")}: {d.quantity} • {t("orderRequest.price")}: {d.price ? `${d.price.toLocaleString()}đ` : t("noData")}
                    </Typography>
                    {d.serviceNames && (
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {t("orderRequest.services")}: {d.serviceNames?.map((s) => translateServiceName(t, s)).join(", ")}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography fontWeight={600} mb={1}>{t("orderRequest.customerDetails")}</Typography>

          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: { xs: 1.25, sm: 2 }, bgcolor: "#fff" }}>
            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.customerName")}</Typography>
              <Typography variant="body2">{fmt(data.customer ?? data.rawOrder?.customerCode)}</Typography>
            </Box>

            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.company")}</Typography>
              <Typography variant="body2">{fmt(data.rawOrder?.companyName)}</Typography>
            </Box>

            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.email")}</Typography>
              <Typography variant="body2">{fmt(data.rawOrder?.email)}</Typography>
            </Box>

            <Box mb={1.25}>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.phone")}</Typography>
              <Typography variant="body2">{fmt(data.rawOrder?.phone)}</Typography>
            </Box>

            <Box>
              <Typography fontSize={14} fontWeight={600}>{t("orderRequest.address")}</Typography>
              <Typography variant="body2">{fmt(data.rawOrder?.address)}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
