import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import { useEffect, useState, useCallback } from "react";
import Drawer from "@mui/material/Drawer";

import { getOrders, getOrderDetails } from "@/api/orderApi";
import { getProductTypes } from "@/api/productTypeApi";
import { getServices } from "@/api/serviceApi";

import OrderDetailDrawer from "./OrderDetailDrawer";
import OrderDetailFullDialog from "../OrderDetailFullDialog";
import ContainerDetailDialog from "./ContainerDetailDialog";

import { useTranslation } from "react-i18next";
import { translateStatus, canonicalStatusKey } from "@/utils/statusHelper";

import orderDetailApi from "@/api/orderDetailApi";
import { getContainer as apiGetContainer } from "@/api/containerApi";

import containerLocationLogApi from "@/api/containerLocationLogApi";
import TrackingLogDialog from "./TrackingLogDialog";

export default function OrderPanel() {
  const { t } = useTranslation(["storagePage", "statusNames"]);
  const theme = useTheme();

  const [search, setSearch] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingDialogData, setTrackingDialogData] = useState<any[] | null>(
    null
  );

  const loadAllDetailsForFullOrders = useCallback(
    async () => {
      setLoading(true);
      try {
        const productTypeNameToId: Record<string, number> = {};
        const serviceNameToId: Record<string, number> = {};

        try {
          const ptResp = await getProductTypes({ pageSize: 1000 });
          const pts = ptResp?.data ?? [];
          pts.forEach((p: any) => {
            const name = String(p.name ?? "").trim();
            const id = p.productTypeId ?? (p.id as number | undefined);
            if (name && id != null) productTypeNameToId[name] = id;
          });
        } catch (err) {
          console.warn("getProductTypes failed", err);
        }

        try {
          const ss = await getServices();
          ss.forEach((s: any) => {
            const name = String(s.name ?? "").trim();
            const id = s.serviceId ?? (s.id as number | undefined);
            if (name && id != null) serviceNameToId[name] = id;
          });
        } catch (err) {
          console.warn("getServices failed", err);
        }

        const ordersResp = await getOrders({
          pageNumber: 1,
          pageSize: 50,
          style: "full",
          status: "processing",
        });

        const ordersRaw = ordersResp.data ?? [];
        const orders = Array.isArray(ordersRaw)
          ? ordersRaw.filter(
            (o: any) =>
              String(o.status ?? "").toLowerCase() === "processing"
          )
          : [];

        const detailsList = await Promise.all(
          orders.map(async (o) => {
            try {
              const resp = await getOrderDetails(o.orderCode);
              const items = resp.data ?? [];

              const mapped = items.map((item: any) => {
                let productTypeIds: number[] =
                  Array.isArray(item.productTypeIds) &&
                    item.productTypeIds.length
                    ? item.productTypeIds
                    : [];

                let serviceIds: number[] =
                  Array.isArray(item.serviceIds) && item.serviceIds.length
                    ? item.serviceIds
                    : [];

                const namesPT: string[] = Array.isArray(item.productTypeNames)
                  ? item.productTypeNames.map((n: any) => String(n).trim())
                  : [];

                if (!productTypeIds.length && namesPT.length) {
                  productTypeIds = namesPT
                    .map((nm) => productTypeNameToId[nm])
                    .filter((v) => v != null) as number[];
                }

                const namesS: string[] = Array.isArray(item.serviceNames)
                  ? item.serviceNames.map((n: any) => String(n).trim())
                  : [];

                if (!serviceIds.length && namesS.length) {
                  serviceIds = namesS
                    .map((nm) => serviceNameToId[nm])
                    .filter((v) => v != null) as number[];
                }

                const orderStatusRaw = o.status ?? null;
                const orderStatusKey = canonicalStatusKey(orderStatusRaw);
                const orderStatusLabel = translateStatus(t, orderStatusRaw);

                return {
                  ...item,
                  productTypeNames: namesPT,
                  serviceNames: namesS,
                  productTypeIds,
                  serviceIds,
                  _orderCode: o.orderCode,
                  _orderStatus: o.status,
                  _orderStatusKey: orderStatusKey,
                  _orderStatusLabel: orderStatusLabel,
                  _orderPaymentStatus: o.paymentStatus,
                  _orderDepositDate: o.depositDate,
                  _orderReturnDate: o.returnDate,
                  _orderTotalPrice: o.totalPrice,
                };
              });

              return mapped.filter(
                (it: any) => !it.storageCode && it.isPlaced !== true
              );
            } catch (err) {
              console.error("Error fetching details for", o.orderCode, err);
              return [];
            }
          })
        );

        const flat = detailsList.flat();
        setDetails(flat);
      } catch (err) {
        console.error("Load orders error", err);
        setDetails([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadAllDetailsForFullOrders();
  }, [loadAllDetailsForFullOrders]);

  const handleOpenDetail = (detail: any) => {
    setSelectedDetail(detail);
    setOpen(true);
  };

  const filtered = details.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(d.containerCode ?? "").toLowerCase().includes(q) ||
      String(d._orderCode ?? "").toLowerCase().includes(q) ||
      String(d.storageCode ?? "").toLowerCase().includes(q) ||
      (Array.isArray(d.productTypeIds) &&
        d.productTypeIds.join(",").toLowerCase().includes(q)) ||
      (Array.isArray(d.serviceIds) &&
        d.serviceIds.join(",").toLowerCase().includes(q))
    );
  });

  const extractOrderDetailFromResp = (resp: any) => {
    if (!resp && resp !== 0) return null;
    if (resp?.data && typeof resp.data === "object") return resp.data;
    if (resp?.data?.data && typeof resp.data.data === "object")
      return resp.data.data;
    if (
      typeof resp === "object" &&
      ("orderDetailId" in resp || "orderCode" in resp)
    )
      return resp;
    return null;
  };

  const [searchLoading, setSearchLoading] = useState(false);
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [containerDialogData, setContainerDialogData] = useState<
    any | null
  >(null);
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false);
  const [orderDetailDialogData, setOrderDetailDialogData] = useState<
    any | null
  >(null);

  const handleSearch = async () => {
    const qRaw = (search ?? "").trim();
    if (!qRaw) return;

    setSearchLoading(true);

    try {
      const isPureNumeric = /^\d+$/.test(qRaw);


      if (isPureNumeric) {
        try {
          const logResp = await containerLocationLogApi.getLogs({
            orderDetailId: Number(qRaw),
            pageNumber: 1,
            pageSize: 20,
          });

          const logs = logResp?.data?.items ?? [];
          if (logs.length > 0) {
            setTrackingDialogData(logs);
            setTrackingDialogOpen(true);
            return;
          }
        } catch (err) {
          console.warn("tracking log fetch error", err);
        }
      }



      const orderDetailPromise = (async () => {
        if (!isPureNumeric) return null;
        try {
          return await orderDetailApi.getOrderDetail(Number(qRaw));
        } catch {
          return null;
        }
      })();

      const containerPromise = (async () => {
        try {
          return await apiGetContainer(qRaw);
        } catch {
          return null;
        }
      })();

      const [odResp, containerResp] = await Promise.all([
        orderDetailPromise,
        containerPromise,
      ]);

      if (isPureNumeric) {
        const od = extractOrderDetailFromResp(odResp);
        if (od) {
          setOrderDetailDialogData(od);
          setOrderDetailDialogOpen(true);
          return;
        }

        if (containerResp) {
          const container = containerResp as any;
          setContainerDialogData(container);
          setContainerDialogOpen(true);
          return;
        }

        setSnackMsg(t("orderPanel.searchNotFound"));
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }

      if (containerResp) {
        const container = containerResp as any;
        setContainerDialogData(container);
        setContainerDialogOpen(true);
        return;
      }

      const odFallback = extractOrderDetailFromResp(odResp);
      if (odFallback) {
        setOrderDetailDialogData(odFallback);
        setOrderDetailDialogOpen(true);
        return;
      }

      setSnackMsg(t("orderPanel.searchNotFound"));
      setSnackSeverity("error");
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg(t("orderPanel.searchError"));
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOnPlaced = (result: { success: boolean; data: any }) => {
    if (result?.success) {
      setSnackMsg(t("orderPanel.placedSuccess"));
      setSnackSeverity("success");
    } else {
      const msg =
        (result?.data &&
          (result.data.error || JSON.stringify(result.data))) ||
        t("orderPanel.placeFailedGeneric");
      setSnackMsg(`${t("orderPanel.placeFailedPrefix")} ${msg}`);
      setSnackSeverity("error");
    }
    setSnackOpen(true);
    setOpen(false);
    loadAllDetailsForFullOrders();
  };

  return (
    <>
      {/* CARD WRAPPER */}
      <Card
        sx={{
          borderRadius: 3,
          bgcolor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.2}
          >
            <Typography fontWeight={600} fontSize={15}>
              {t("orderPanel.title")}
            </Typography>
          </Box>

          {/* SEARCH FIELD */}
          <TextField
            placeholder={t("orderPanel.searchPlaceholder")}
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={
                      t("orderPanel.searchTooltip") ??
                      "Search OrderDetail ID / Container Code"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleSearch}
                        disabled={searchLoading}
                      >
                        {searchLoading ? (
                          <CircularProgress size={18} />
                        ) : (
                          <SearchRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />

          {/* SUBHEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
          >
            <Typography fontSize={13} fontWeight={600} color="text.secondary">
              {t("orderPanel.showing", { count: filtered.length })}
              {loading ? ` • ${t("orderPanel.loading")}` : ""}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              <Tooltip title={t("orderPanel.listView")}>
                <IconButton size="small">
                  <ViewListOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t("orderPanel.mapView")}>
                <IconButton size="small">
                  <MapOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t("orderPanel.gridView")}>
                <IconButton size="small">
                  <ViewModuleOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* DETAILS LIST */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              pr: 0.5,

              overflowY: "auto",
              minHeight: 0,
            }}
          >
            {filtered.map((d, i) => (
              <Box
                key={`${d.orderDetailId}-${i}`}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "calc(50% - 4px)",
                  },
                }}
                onClick={() => handleOpenDetail(d)}
              >
                <Card
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    backgroundColor:
                      i % 2 === 0 ? "#e3f2fd" : "#ede7f6",
                    p: 1.3,
                    cursor: "pointer",
                    transition: "0.2s",
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      bgcolor: "#f9fbff",
                    },
                  }}
                >
                  <Box display="flex" justifyContent="flex-end" mb={0.3}>
                    <DragIndicatorOutlinedIcon
                      sx={{
                        fontSize: 16,
                        color: "text.secondary",
                        opacity: 0.6,
                      }}
                    />
                  </Box>

                  <Typography
                    fontWeight={600}
                    fontSize={13}
                    mb={0.4}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <LockOutlinedIcon
                      sx={{ fontSize: 15, color: "text.secondary" }}
                    />
                    {d.containerCode
                      ? `${t("orderPanel.containerLabel", {
                        code: d.containerCode,
                      })}`
                      : t("orderPanel.detailLabel", {
                        id: d.orderDetailId ?? i,
                      })}
                  </Typography>

                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      {t("orderPanel.orderPrefix")}:{" "}
                      <strong>{d._orderCode}</strong>
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {t("orderPanel.statusLabel")}:{" "}
                      {d._orderStatusLabel ?? d._orderStatus ?? "-"}
                    </Typography>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Drawer: Order Detail */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        transitionDuration={300}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "70%", md: "520px" },
            height: "100vh",
            borderRadius: { xs: 0, sm: "12px 0 0 12px" },
            boxShadow: "-6px 0 20px rgba(0,0,0,0.08)",
            overflowY: "auto",
          },
        }}
      >
        <OrderDetailDrawer
          data={selectedDetail}
          onClose={() => setOpen(false)}
          onPlaced={handleOnPlaced}
        />
      </Drawer>

      {/* OrderDetail modal */}
      <OrderDetailFullDialog
        open={orderDetailDialogOpen}
        data={orderDetailDialogData}
        onClose={() => {
          setOrderDetailDialogOpen(false);
          setOrderDetailDialogData(null);
        }}
      />

      {/* Container detail dialog */}
      <ContainerDetailDialog
        open={containerDialogOpen}
        container={containerDialogData}
        onClose={() => {
          setContainerDialogOpen(false);
          setContainerDialogData(null);
        }}
        onSaveLocal={() => loadAllDetailsForFullOrders()}
        onNotify={(msg, sev) => {
          setSnackMsg(msg);
          setSnackSeverity(sev ?? "info");
          setSnackOpen(true);
        }}
        onRemoved={() => {
          loadAllDetailsForFullOrders();
          setContainerDialogOpen(false);
          setContainerDialogData(null);
        }}
      />

      {/* Tracking Dialog */}
      <TrackingLogDialog
        open={trackingDialogOpen}
        data={trackingDialogData}
        onClose={() => {
          setTrackingDialogOpen(false);
          setTrackingDialogData(null);
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          sx={{ width: "100%" }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
