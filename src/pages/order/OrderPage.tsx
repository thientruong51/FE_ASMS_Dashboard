import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import orderApi, { type OrderRespItem } from "@/api/orderApi";
import OrderDetailDrawer from "./components/OrderDetailDrawer";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setPendingOrderCount } from "@/features/orders/ordersSlice";
import { translateStatus, translatePaymentStatus, translateStyle } from "@/utils/translationHelpers";
import orderDetailApi from "@/api/orderDetailApi";
import { getContainer as apiGetContainer } from "@/api/containerApi";
import containerLocationLogApi from "@/api/containerLocationLogApi";
import TrackingLogDialog from "../storage/widgets/TrackingLogDialog";
import ContainerDetailDialog from "../storage/widgets/ContainerDetailDialog";


function ToolbarExtras({
  onExport,
  onRefresh,
  exportLabel,
  refreshLabel,
}: {
  onExport: () => void;
  onRefresh: () => void;
  exportLabel: string;
  refreshLabel: string;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
      <Button startIcon={<DownloadIcon />} size="small" onClick={onExport}>
        {exportLabel}
      </Button>
      <Button startIcon={<RefreshIcon />} size="small" onClick={onRefresh}>
        {refreshLabel}
      </Button>
    </Box>
  );
}

export default function OrderPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("order");
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [orders, setOrders] = useState<OrderRespItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPayment] = useState("");

  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderFull, setOrderFull] = useState<OrderRespItem | undefined>(undefined);
  const [orderLoading, setOrderLoading] = useState(false);

  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");
  const [searchLoading, setSearchLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Tracking
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingDialogData, setTrackingDialogData] = useState<any[] | null>(null);

  // Container
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [containerDialogData, setContainerDialogData] = useState<any | null>(null);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const resp = await orderApi.getOrders({ page: 1, pageSize: 1000, q: search, paymentStatus: filterPayment });
      const list = resp?.data ?? [];
      setOrders(list);
      const pendingCount = (list ?? []).filter(
        (o) => String(o.status).toLowerCase() !== "completed"
      ).length;

      dispatch(setPendingOrderCount(pendingCount));
    } catch (err) {
      console.error("getOrders failed", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    if (drawerOpen) return;

    const interval = setInterval(() => {
      fetchAllOrders();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [search, filterPayment, drawerOpen]);

  const looksLikeFullOrder = (o: any) => {
    if (!o) return false;
    return !!(o.customerName || o.email || o.address || o.phoneContact);
  };

  const openDrawerFor = async (rowOrOrder: any) => {
    if (!rowOrOrder) return;
    const orderObj = rowOrOrder.__orderFull ?? rowOrOrder;
    const code = orderObj.orderCode ?? rowOrOrder.orderCode;
    if (!code) return;

    setSelectedOrderCode(code);

    if (looksLikeFullOrder(orderObj)) {
      setOrderFull(orderObj as OrderRespItem);
      setDrawerOpen(true);
      return;
    }

    setOrderLoading(true);
    setOrderFull(undefined);
    try {
      const data = await orderApi.getOrder(code);
      if (data) {
        setOrderFull(data as OrderRespItem);
      } else {
        setOrderFull(orderObj as OrderRespItem);
      }
    } catch (err) {
      console.warn("Failed to fetch full order, falling back to summary:", err);
      setOrderFull(orderObj as OrderRespItem);
    } finally {
      setOrderLoading(false);
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrderCode(null);
    setOrderFull(undefined);
  };

  const fmtMoney = (v: any) => (v == null ? "-" : Number(v).toLocaleString());

  const fmtDate = (d: any): string => {
    if (d === null || typeof d === "undefined" || d === "") return "-";

    if (d instanceof Date) {
      return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
    }

    const s = String(d).trim();

    const pureDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const tryIso = pureDateMatch ? `${s}T00:00:00` : s;

    const dt = new Date(tryIso);
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString();
    }

    const asNum = Number(s);
    if (!Number.isNaN(asNum)) {
      const dt2 = new Date(asNum);
      if (!Number.isNaN(dt2.getTime())) return dt2.toLocaleDateString();
    }

    return s;
  };

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

  const handleSearch = async () => {
    const qRaw = (search ?? "").trim();
    if (!qRaw) return;

    setSearchLoading(true);

    try {
      const isPureNumeric = /^\d+$/.test(qRaw);

      // 1️⃣ Tracking log theo OrderDetailId
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

      // 2️⃣ Song song tìm OrderDetail & Container
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

      // 3️⃣ Ưu tiên OrderDetail
      if (isPureNumeric) {
        const od = extractOrderDetailFromResp(odResp);
        if (od) {
          openDrawerFor({ orderCode: od.orderCode });
          return;
        }

        if (containerResp) {
          setContainerDialogData(containerResp);
          setContainerDialogOpen(true);
          return;
        }

        setSnackMsg(t("page.searchNotFound"));
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }

      // 4️⃣ Text → Container trước
      if (containerResp) {
        setContainerDialogData(containerResp);
        setContainerDialogOpen(true);
        return;
      }

      const odFallback = extractOrderDetailFromResp(odResp);
      if (odFallback) {
        openDrawerFor({ orderCode: odFallback.orderCode });
        return;
      }

      setSnackMsg(t("page.searchNotFound"));
      setSnackSeverity("error");
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg(t("page.searchError"));
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSearchLoading(false);
    }
  };


  const withTooltip = (original?: string | null, translated?: string | null) => {
    const text = translated ?? original ?? "-";
    if (!original || String(text).length < 30) {
      return <span>{text}</span>;
    }

    return (
      <Tooltip title={original}>
        <span className="ellipsis">{text}</span>
      </Tooltip>
    );
  };


  const columns = useMemo<GridColDef<any, any, any>[]>(() => {
    return [
      {
        field: "orderCode",
        headerName: t("table.orderCode"),
        minWidth: 150,
        flex: 1,
        renderCell: (params: any) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>
            <Tooltip title={t("actions.copyOrderCode")}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(String(params.value));
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      { field: "customerCode", headerName: t("table.customer"), minWidth: 120, flex: 0.9 },


      {
        field: "phoneContact",
        headerName: t("table.phone") ?? "Phone",
        minWidth: 130,
        flex: 0.8,
      },
      {
        field: "address",
        headerName: t("table.address") ?? "Address",
        minWidth: 220,
        flex: 1.2,
        renderCell: (params: any) => withTooltip(params.value, params.value),
      },

      {
        field: "orderDate",
        headerName: t("table.orderDate") ?? "Order date",
        minWidth: 120,
        flex: 0.8,
        renderCell: (params: any) => fmtDate(params.value),
      },

      {
        field: "returnDate",
        headerName: t("table.returnDate") ?? "Return",
        minWidth: 120,
        flex: 0.8,
        renderCell: (params: any) => fmtDate(params.value),
      },

      {
        field: "status",
        headerName: t("table.status"),
        minWidth: 140,
        flex: 0.8,
        renderCell: (params: any) => {
          const raw = String(params.value ?? "");
          const translated = translateStatus(t, raw);
          return <Chip label={withTooltip(raw, translated)} size="small" />;
        },
      },
      {
        field: "paymentStatus",
        headerName: t("table.payment"),
        minWidth: 130,
        flex: 0.9,
        renderCell: (params: any) => {
          const raw = String(params.value ?? "");
          const translated = translatePaymentStatus(t, raw);
          const isPaid = raw.toLowerCase() === "paid";
          return <Chip label={withTooltip(raw, translated)} size="small" color={isPaid ? "success" : "warning"} />;
        },
      },

      {
        field: "totalPrice",
        headerName: t("table.total"),
        minWidth: 120,
        flex: 0.8,
        renderCell: (params: any) => fmtMoney(params.value),
        type: "number",
      },

      {
        field: "style",
        headerName: t("table.style"),
        minWidth: 100,
        flex: 0.6,
        renderCell: (params: any) => {
          const raw = params.value ?? "";
          const translated = translateStyle(t, String(raw));
          return withTooltip(String(raw), translated);
        },
      },









      {
        field: "actions",
        headerName: t("table.actions"),
        width: 140,
        sortable: false,
        renderCell: (params: any) => {
          const code = params.row?.orderCode;
          const isLoadingForThis = orderLoading && selectedOrderCode === code;
          return (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Tooltip title={t("actions.viewDetails")}>
                <span>
                  <IconButton size="small" onClick={() => openDrawerFor(params.row)} disabled={isLoadingForThis}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {isLoadingForThis && <CircularProgress size={18} />}
            </Box>
          );
        },
      },
    ];
  }, [orderLoading, selectedOrderCode, t]);

  function filteredWithMemo(all: OrderRespItem[], s: string, _paymentFilter: string) {
    const q = (s ?? "").trim().toLowerCase();
    return all
      .filter((o) => {
        if (!q) return true;
        return (
          String(o.orderCode ?? "").toLowerCase().includes(q) ||
          String(o.customerCode ?? "").toLowerCase().includes(q) ||
          String(o.customerName ?? "").toLowerCase().includes(q) ||
          String(o.phoneContact ?? "").toLowerCase().includes(q)
        );
      })
      .map((r) => ({ id: r.orderCode, __orderFull: r, ...r }));
  }

  const rowsWithFull = useMemo(() => {
    return filteredWithMemo(orders, search, filterPayment);
  }, [orders, search, filterPayment]);

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) return;
    const rows = filteredWithMemo(orders, search, filterPayment);
    const keys = [
      "orderCode",
      "customerCode",
      "customerName",
      "phoneContact",
      "orderDate",
      "depositDate",
      "returnDate",
      "status",
      "paymentStatus",
      "totalPrice",
      "style",
      "address",
      "passkey",
      "refund",
      "imageUrls",
    ];
    const header = keys.join(",");
    const csv = [header]
      .concat(
        rows.map((r) =>
          keys
            .map((k) => {
              const v = (r as any)[k];
              if (v == null) return "";
              if (Array.isArray(v)) return `"${v.join(";")}"`;
              return `"${String(v).replace(/"/g, '""')}"`;
            })
            .join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("export.filenamePrefix") ?? "orders"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, overflowX: "hidden" }}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={700}>
          {t("page.title")}
        </Typography>
        <Typography color="text.secondary">{t("page.subtitle")}</Typography>
      </Box>

      <Card sx={{ mb: 2, maxWidth: "100%", overflow: "visible" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                placeholder={t("page.searchPlaceholder")}
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
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={t("page.searchTooltip") ?? "Search Order / Container"}>
                        <span>
                          <IconButton size="small" onClick={handleSearch} disabled={searchLoading}>
                            {searchLoading ? <CircularProgress size={18} /> : <SearchIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="text" onClick={() => setDensity(density === "standard" ? "compact" : "standard")}>
                {t("actions.toggleDensity")}
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                {t("actions.export")}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: "100%", overflow: "visible" }}>
        <CardContent>
          <ToolbarExtras onExport={handleExportCsv} onRefresh={fetchAllOrders} exportLabel={t("actions.exportCsv")} refreshLabel={t("actions.refresh")} />

          {isSm ? (
            <Stack spacing={2}>
              {rowsWithFull.map((o: any) => {
                const styleTranslated = translateStyle(t, String(o.style ?? ""));
                return (
                  <Card key={o.orderCode} variant="outlined">
                    <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography fontWeight={700}>{o.orderCode}</Typography>
                        <Typography color="text.secondary">
                          {o.customerCode ?? "-"} • {o.customerName ?? "-"} {o.style ? <>• {withTooltip(String(o.style ?? ""), styleTranslated)}</> : null}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {fmtDate(o.orderDate)} • {fmtMoney(o.totalPrice)} • unpaid: {fmtMoney(o.unpaidAmount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Button size="small" onClick={() => openDrawerFor(o)} startIcon={<VisibilityIcon />} disabled={orderLoading && selectedOrderCode === o.orderCode}>
                          {t("actions.details")}
                        </Button>
                        {orderLoading && selectedOrderCode === o.orderCode && <CircularProgress size={18} />}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <div style={{ width: "100%" }}>
                <DataGrid
                  rows={rowsWithFull as any[]}
                  columns={columns as GridColDef<any, any, any>[]}
                  autoHeight
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  }}
                  loading={loading}
                  getRowId={(r: any) => r.orderCode}
                  sx={{
                    border: "none",
                    minWidth: 1200,
                    "& .MuiDataGrid-virtualScroller": {
                      overflow: "auto",
                    },
                  }}
                  density={density}
                  disableRowSelectionOnClick
                  onRowDoubleClick={(params: any) => openDrawerFor(params.row)}
                />
              </div>
            </Box>
          )}
        </CardContent>
      </Card>
      {/* Tracking Dialog */}
      <TrackingLogDialog
        open={trackingDialogOpen}
        data={trackingDialogData}
        onClose={() => {
          setTrackingDialogOpen(false);
          setTrackingDialogData(null);
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
        onSaveLocal={() => fetchAllOrders()}
        onNotify={(msg, sev) => {
          setSnackMsg(msg);
          setSnackSeverity(sev ?? "info");
          setSnackOpen(true);
        }}
        onRemoved={() => {
          fetchAllOrders();
          setContainerDialogOpen(false);
          setContainerDialogData(null);
        }}
      />
      <OrderDetailDrawer orderCode={selectedOrderCode} open={drawerOpen} onClose={closeDrawer} orderFull={orderFull} />
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
