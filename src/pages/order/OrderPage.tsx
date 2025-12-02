import  { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import orderApi from "@/api/orderApi";
import OrderDetailDrawer from "./components/OrderDetailDrawer";
import { useTranslation } from "react-i18next";

function ToolbarExtras({ onExport, onRefresh, exportLabel, refreshLabel }: { onExport: () => void; onRefresh: () => void; exportLabel: string; refreshLabel: string }) {
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
  const { t } = useTranslation("order");
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPayment] = useState("");

  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderFull, setOrderFull] = useState<any | undefined>(undefined);
  const [orderLoading, setOrderLoading] = useState(false);

  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const resp = await orderApi.getOrders({ page: 1, pageSize: 1000, q: search, paymentStatus: filterPayment });
      setOrders(resp.data ?? []);
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

  const looksLikeFullOrder = (o: any) => {
    if (!o) return false;
    return !!(o.customerName || o.customerEmail || o.customerAddress);
  };

  const openDrawerFor = async (rowOrOrder: any) => {
    if (!rowOrOrder) return;
    const orderObj = rowOrOrder.__orderFull ?? rowOrOrder;
    const code = orderObj.orderCode ?? rowOrOrder.orderCode;
    if (!code) return;

    setSelectedOrderCode(code);

    if (looksLikeFullOrder(orderObj)) {
      setOrderFull(orderObj);
      setDrawerOpen(true);
      return;
    }

    setOrderLoading(true);
    setOrderFull(undefined);
    try {
      const resp = await orderApi.getOrder(code);
      const data = resp && (resp.data ?? resp) ? (resp.data ?? resp) : null;
      if (data) {
        setOrderFull(data);
      } else {
        setOrderFull(orderObj);
      }
    } catch (err) {
      console.warn("Failed to fetch full order, falling back to summary:", err);
      setOrderFull(orderObj);
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
        field: "status",
        headerName: t("table.status"),
        minWidth: 120,
        flex: 0.8,
        renderCell: (params: any) => <Chip label={String(params.value ?? "-")} size="small" />,
      },
      {
        field: "paymentStatus",
        headerName: t("table.payment"),
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: any) => (
          <Chip
            label={String(params.value ?? "-")}
            size="small"
            color={String(params.value ?? "").toLowerCase() === "paid" ? "success" : "default"}
          />
        ),
      },
      {
        field: "totalPrice",
        headerName: t("table.total"),
        minWidth: 110,
        flex: 0.8,
        renderCell: (params: any) => fmtMoney(params.value),
        type: "number",
      },

      { field: "style", headerName: t("table.style"), minWidth: 100, flex: 0.6 },
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

  function filteredWithMemo(all: any[], s: string, _paymentFilter: string) {
    const q = (s ?? "").trim().toLowerCase();
    return all
      .filter((o) => {
        if (!q) return true;
        return (
          String(o.orderCode ?? "").toLowerCase().includes(q) ||
          String(o.customerCode ?? "").toLowerCase().includes(q)
        );
      })
      .map((r) => ({ id: r.orderCode, __orderFull: r, ...r }));
  }

  const rowsWithFull = filteredWithMemo(orders, search, filterPayment);

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) return;
    const rows = filteredWithMemo(orders, search, filterPayment);
    const keys = [
      "orderCode",
      "customerCode",
      "orderDate",
      "depositDate",
      "returnDate",
      "status",
      "paymentStatus",
      "totalPrice",
      "unpaidAmount",
      "style",
    ];
    const header = keys.join(",");
    const csv = [header]
      .concat(
        rows.map((r) =>
          keys
            .map((k) => {
              const v = r[k];
              if (v == null) return "";
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
    a.download = `${t("export.filenamePrefix")}_${new Date().toISOString().slice(0, 10)}.csv`;
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
          {/* Controls */}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
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
              {rowsWithFull.map((o: any) => (
                <Card key={o.orderCode} variant="outlined">
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography fontWeight={700}>{o.orderCode}</Typography>
                      <Typography color="text.secondary">{o.customerCode ?? "-"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        size="small"
                        onClick={() => openDrawerFor(o)}
                        startIcon={<VisibilityIcon />}
                        disabled={orderLoading && selectedOrderCode === o.orderCode}
                      >
                        {t("actions.details")}
                      </Button>
                      {orderLoading && selectedOrderCode === o.orderCode && <CircularProgress size={18} />}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <div style={{ width: "100%" }}>
                <DataGrid
                  rows={rowsWithFull as any[]}
                  columns={columns as GridColDef<any, any, any>[]}
                  autoHeight
                  pageSizeOptions={[10, 25, 50, 100]}
                  loading={loading}
                  getRowId={(r: any) => r.orderCode}
                  sx={{
                    border: "none",
                    minWidth: 700,
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

      <OrderDetailDrawer
        orderCode={selectedOrderCode}
        open={drawerOpen}
        onClose={closeDrawer}
        orderFull={orderFull}
      />
    </Box>
  );
}
