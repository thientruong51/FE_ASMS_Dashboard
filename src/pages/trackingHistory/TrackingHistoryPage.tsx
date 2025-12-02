import  { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import * as trackingApi from "@/api/trackingHistoryApi";
import TrackingHistoryDetailDrawer from "./components/TrackingHistoryDetailDrawer";

function ToolbarExtras({
  onExport,
  onRefresh,
}: {
  onExport: () => void;
  onRefresh: () => void;
}) {
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

export default function TrackingHistoryPage() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [items, setItems] = useState<trackingApi.TrackingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterOrderCode] = useState("");

  // Drawer
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemFull, setItemFull] = useState<trackingApi.TrackingHistoryItem | null>(null);

  // UI
  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");

  // Expanded orders map: orderCode -> bool
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // fetchAll
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await trackingApi.getTrackingHistories({
        page: 1,
        pageSize: 1000,
        orderCode: filterOrderCode || undefined,
        q: search || undefined,
      });
      setItems(resp.data ?? []);
    } catch (err) {
      console.error("getTrackingHistories failed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterOrderCode, search]);

  useEffect(() => {
    fetchAll();
  }, []);



  const openDrawerFor = (row: trackingApi.TrackingHistoryItem) => {
    if (!row) return;
    setSelectedId(row.trackingHistoryId);
    setItemFull(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setItemFull(null);
  };

  const fmtDate = (v: any) => (v ? String(v) : "-");

  const latestPerOrder = useMemo(() => {
    const map = new Map<string, trackingApi.TrackingHistoryItem>();
    for (const it of items) {
      const key = it.orderCode;
      if (!key) continue; 
      const prev = map.get(key);
      if (!prev) {
        map.set(key, it);
      } else {
        const prevTime = prev.createAt ? new Date(prev.createAt).getTime() : 0;
        const curTime = it.createAt ? new Date(it.createAt).getTime() : 0;
        if (curTime > prevTime) {
          map.set(key, it);
        } else if (curTime === prevTime) {
          const prevId = Number(prev.trackingHistoryId ?? 0);
          const curId = Number(it.trackingHistoryId ?? 0);
          if (curId > prevId) map.set(key, it);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.createAt ? new Date(a.createAt).getTime() : 0;
      const tb = b.createAt ? new Date(b.createAt).getTime() : 0;
      if (ta !== tb) return tb - ta;
      return Number(b.trackingHistoryId ?? 0) - Number(a.trackingHistoryId ?? 0);
    });
  }, [items]);

  const olderEntriesFor = useCallback(
    (orderCode: string, latestId?: number) => {
      return items
        .filter((it) => it.orderCode === orderCode && it.trackingHistoryId !== latestId)
        .sort((a, b) => {
          const ta = a.createAt ? new Date(a.createAt).getTime() : 0;
          const tb = b.createAt ? new Date(b.createAt).getTime() : 0;
          if (ta !== tb) return tb - ta;
          return Number(b.trackingHistoryId ?? 0) - Number(a.trackingHistoryId ?? 0);
        });
    },
    [items]
  );

  const toggleExpand = (orderCode: string) => {
    setExpandedOrders((s) => ({ ...s, [orderCode]: !s[orderCode] }));
  };


  const flattenedRows = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    const filteredLatest = latestPerOrder.filter((r) => {
      if (filterOrderCode) {
        if (!r.orderCode) return false;
        if (!String(r.orderCode).includes(filterOrderCode)) return false;
      }
      if (!q) return true;
      return (
        String(r.orderCode ?? "").toLowerCase().includes(q) ||
        String(r.actionType ?? "").toLowerCase().includes(q) ||
        String(r.newStatus ?? "").toLowerCase().includes(q) ||
        String(r.oldStatus ?? "").toLowerCase().includes(q)
      );
    });

    const rows: any[] = [];
    for (const latest of filteredLatest) {
      rows.push({ ...latest, _isChild: false }); 
      const orderCode = latest.orderCode!;
      if (expandedOrders[orderCode]) {
        const older = olderEntriesFor(orderCode, latest.trackingHistoryId);
        for (const child of older) {
          rows.push({
            ...child,
            _isChild: true,
            _rowId: `child-${latest.trackingHistoryId}-${child.trackingHistoryId}`,
            _parentId: latest.trackingHistoryId,
          });
        }
      }
    }
    return rows;
  }, [latestPerOrder, expandedOrders, search, filterOrderCode, olderEntriesFor]);

  const columns = useMemo<GridColDef<any, any, any>[]>(
    () => [
      {
        field: "trackingHistoryId",
        headerName: "ID",
        width: 100,
        renderCell: (params: any) =>
          params.row._isChild ? (
            <Typography variant="body2" sx={{ ml: 2 }}>
              {params.value}
            </Typography>
          ) : (
            <Typography variant="body2">{params.value}</Typography>
          ),
      },
      {
        field: "orderCode",
        headerName: "OrderCode",
        minWidth: 200,
        flex: 1,
        renderCell: (params: any) => {
          const isChild = params.row._isChild;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: isChild ? 500 : 700,
                  fontSize: isChild ? 13 : 14,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ml: isChild ? 2 : 0,
                }}
                title={String(params.value ?? "")}
              >
                {params.value ?? "-"}
              </Typography>
              <Tooltip title="Copy orderCode">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(String(params.value ?? ""));
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        field: "actionType",
        headerName: "Action",
        minWidth: 200,
        flex: 1,
        renderCell: (params: any) =>
          params.row._isChild ? (
            <Typography variant="body2" sx={{ ml: 2 }}>
              {params.value ?? `#${params.row.trackingHistoryId}`}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value ?? `#${params.row.trackingHistoryId}`}
            </Typography>
          ),
      },
      {
        field: "oldStatus",
        headerName: "Old",
        minWidth: 120,
        flex: 0.6,
        renderCell: (p: any) => <span>{String(p.value ?? "-")}</span>,
      },
      {
        field: "newStatus",
        headerName: "New",
        minWidth: 120,
        flex: 0.6,
        renderCell: (p: any) => <span>{String(p.value ?? "-")}</span>,
      },
      {
        field: "createAt",
        headerName: "Created",
        minWidth: 160,
        flex: 0.9,
        renderCell: (p: any) =>
          p.row._isChild ? (
            <Typography variant="body2" sx={{ ml: 2 }}>
              {fmtDate(p.value)}
            </Typography>
          ) : (
            <span>{fmtDate(p.value)}</span>
          ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        renderCell: (params: any) => {
          const isChild = params.row._isChild;
          const orderCode = params.row.orderCode as string | undefined;
          const isLatestRow = !isChild;
          return (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* Details button */}
              <Tooltip title="View details">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openDrawerFor(params.row)}
                    aria-label="details"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Expand / collapse only for latest rows */}
              {isLatestRow && orderCode && (
                <Tooltip title={expandedOrders[orderCode] ? "Collapse" : "Show history"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => {
                        toggleExpand(orderCode);
                      }}
                    >
                      {expandedOrders[orderCode] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    [expandedOrders]
  );

  const getRowId = (r: any) => r._rowId ?? r.trackingHistoryId;

  const handleExportCsv = () => {
    if (!latestPerOrder || latestPerOrder.length === 0) return;
    const rows = latestPerOrder;
    const keys = [
      "trackingHistoryId",
      "orderCode",
      "actionType",
      "oldStatus",
      "newStatus",
      "createAt",
      "currentAssign",
      "nextAssign",
      "image",
    ];
    const header = keys.join(",");
    const csv = [header]
      .concat(
        rows.map((r) =>
          keys
            .map((k) => {
              const v = (r as any)[k];
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
    a.download = `tracking_history_latest_per_order_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={700}>
          Tracking History
        </Typography>
        <Typography color="text.secondary">View and manage tracking events</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                placeholder="Search orderCode / action / status..."
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
              {latestPerOrder
                .filter((r) => {
                  if (filterOrderCode) {
                    if (!r.orderCode) return false;
                    if (!String(r.orderCode).includes(filterOrderCode)) return false;
                  }
                  const q = (search ?? "").trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(r.orderCode ?? "").toLowerCase().includes(q) ||
                    String(r.actionType ?? "").toLowerCase().includes(q) ||
                    String(r.newStatus ?? "").toLowerCase().includes(q) ||
                    String(r.oldStatus ?? "").toLowerCase().includes(q)
                  );
                })
                .map((latest) => {
                  const orderCode = latest.orderCode!;
                  const expanded = !!expandedOrders[orderCode];
                  const older = olderEntriesFor(orderCode, latest.trackingHistoryId);
                  return (
                    <Card key={latest.trackingHistoryId} variant="outlined">
                      <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography fontWeight={700}>{latest.actionType ?? `#${latest.trackingHistoryId}`}</Typography>
                          <Typography color="text.secondary">
                            {latest.orderCode ?? "-"} • {fmtDate(latest.createAt)} • New: {latest.newStatus ?? "-"}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => openDrawerFor(latest)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton size="small" onClick={() => toggleExpand(orderCode)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </CardContent>
                      {expanded &&
                        older.map((o) => (
                          <CardContent key={o.trackingHistoryId} sx={{ borderTop: "1px solid #eee" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Box>
                                <Typography fontWeight={600} sx={{ fontSize: 13 }}>
                                  {o.actionType ?? `#${o.trackingHistoryId}`}
                                </Typography>
                                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                                  {fmtDate(o.createAt)} • {o.oldStatus ?? "-"} → {o.newStatus ?? "-"}
                                </Typography>
                              </Box>
                              <Button size="small" onClick={() => openDrawerFor(o)}>
                                Details
                              </Button>
                            </Box>
                          </CardContent>
                        ))}
                    </Card>
                  );
                })}
            </Stack>
          ) : (
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={flattenedRows as any[]}
                columns={columns as GridColDef<any, any, any>[]}
                autoHeight
                pageSizeOptions={[10, 25, 50, 100]}
                loading={loading}
                getRowId={getRowId}
                sx={{ border: "none" }}
                density={density}
                disableRowSelectionOnClick
                onRowDoubleClick={(params: any) => openDrawerFor(params.row)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <TrackingHistoryDetailDrawer
        trackingId={selectedId}
        open={drawerOpen}
        onClose={closeDrawer}
        item={itemFull ?? undefined}
        onActionComplete={async () => {
          await fetchAll();
        }}
      />
    </Box>
  );
}
