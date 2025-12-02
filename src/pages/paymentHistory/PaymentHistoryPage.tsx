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
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import * as paymentApi from "@/api/paymentHistoryApi";
import PaymentHistoryDetailDrawer from "./components/PaymentHistoryDetailDrawer";

function ToolbarExtras({ onExport, onRefresh }: { onExport: () => void; onRefresh: () => void }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
      <Button startIcon={<DownloadIcon />} size="small" onClick={onExport}>
        Export CSV
      </Button>
      <Button startIcon={<RefreshIcon />} size="small" onClick={onRefresh}>
        Refresh
      </Button>
    </Box>
  );
}

export default function PaymentHistoryPage() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [items, setItems] = useState<paymentApi.PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterOrderCode] = useState("");

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemFull, setItemFull] = useState<paymentApi.PaymentHistoryItem | undefined>(undefined);
  const [itemLoading] = useState(false);

  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const resp = await paymentApi.getPaymentHistories({ page: 1, pageSize: 1000, orderCode: filterOrderCode || undefined });
      setItems(resp.data ?? resp ?? []);
    } catch (err) {
      console.error("getPaymentHistories failed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);



  const openDrawerFor = async (row: paymentApi.PaymentHistoryItem) => {
    if (!row) return;
    setSelectedCode(row.paymentHistoryCode);
    setItemFull(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedCode(null);
    setItemFull(undefined);
  };

  const fmtMoney = (v: any) => (v == null ? "-" : Number(v).toLocaleString());

  const columns = useMemo<GridColDef<any, any, any>[]>(
    () => [
      { field: "paymentHistoryCode", headerName: "Code", minWidth: 240, flex: 1 },
      {
        field: "orderCode",
        headerName: "Order",
        minWidth: 160,
        flex: 0.9,
        renderCell: (p: any) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography noWrap>{p.value ?? "-"}</Typography>
            <Tooltip title="Copy orderCode">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(String(p.value ?? ""));
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      { field: "paymentMethod", headerName: "Method", minWidth: 140, flex: 0.8 },
      { field: "paymentPlatform", headerName: "Platform", minWidth: 140, flex: 0.8 },
      {
        field: "amount",
        headerName: "Amount",
        minWidth: 120,
        flex: 0.8,
        type: "number",
        renderCell: (p: any) => fmtMoney(p.value),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params: any) => {
          const code = params.row?.paymentHistoryCode;
          const isLoadingForThis = itemLoading && selectedCode === code;
          return (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Tooltip title="View details">
                <span>
                  <IconButton size="small" onClick={() => openDrawerFor(params.row)} disabled={isLoadingForThis}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {isLoadingForThis && <CircularProgress size={16} />}
            </Box>
          );
        },
      },
    ],
    [itemLoading, selectedCode]
  );

  function filteredWithMemo(all: any[], s: string, orderFilter: string) {
    const q = (s ?? "").trim().toLowerCase();
    return all
      .filter((o) => {
        if (orderFilter) {
          if (!o.orderCode) return false;
          if (!String(o.orderCode).includes(orderFilter)) return false;
        }
        if (!q) return true;
        return (
          String(o.paymentHistoryCode ?? "").toLowerCase().includes(q) ||
          String(o.orderCode ?? "").toLowerCase().includes(q) ||
          String(o.paymentMethod ?? "").toLowerCase().includes(q) ||
          String(o.paymentPlatform ?? "").toLowerCase().includes(q)
        );
      })
      .map((r) => ({ id: r.paymentHistoryCode, ...r }));
  }

  const rowsWithFull = filteredWithMemo(items, search, filterOrderCode);

  const handleExportCsv = () => {
    if (!items || items.length === 0) return;
    const rows = filteredWithMemo(items, search, filterOrderCode);
    const keys = ["paymentHistoryCode", "orderCode", "paymentMethod", "paymentPlatform", "amount"];
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
    a.download = `payment_history_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={700}>
          Payment History
        </Typography>
        <Typography color="text.secondary">List of payment events</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                placeholder="Search code / order / method..."
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

           

            <Box sx={{ display: "flex", gap: 1 }}>
              
              <Button variant="text" onClick={() => setDensity(density === "standard" ? "compact" : "standard")}>
                Toggle density
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                Export
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToolbarExtras onExport={handleExportCsv} onRefresh={fetchAll} />

          {isSm ? (
            <Stack spacing={2}>
              {rowsWithFull.map((o: any) => (
                <Card key={o.paymentHistoryCode} variant="outlined">
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography fontWeight={700}>{o.paymentHistoryCode}</Typography>
                      <Typography color="text.secondary">{o.orderCode ?? "-"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button size="small" onClick={() => openDrawerFor(o)} startIcon={<VisibilityIcon />}>
                        Details
                      </Button>
                      {itemLoading && selectedCode === o.paymentHistoryCode && <CircularProgress size={18} />}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={rowsWithFull as any[]}
                columns={columns as GridColDef<any, any, any>[]}
                autoHeight
                pageSizeOptions={[10, 25, 50, 100]}
                loading={loading}
                getRowId={(r: any) => r.paymentHistoryCode}
                sx={{ border: "none" }}
                density={density}
                disableRowSelectionOnClick
                onRowDoubleClick={(params: any) => openDrawerFor(params.row)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentHistoryDetailDrawer code={selectedCode} open={drawerOpen} onClose={closeDrawer} item={itemFull} />
    </Box>
  );
}
