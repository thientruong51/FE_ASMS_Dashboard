import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { getAuthClaimsFromStorage } from "@/utils/auth";
import { useDispatch } from "react-redux";
import { setPendingTrackingCount } from "@/features/tracking/trackingSlice";
import {
  translateStatus,
  translateActionType,
} from "@/utils/translationHelpers";

function ToolbarExtras({ onExport, onRefresh }: { onExport: () => void; onRefresh: () => void }) {
  const { t } = useTranslation("trackingHistoryPage");
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
      <Button startIcon={<DownloadIcon />} size="small" onClick={onExport}>{t("exportCsv")}</Button>
      <Button startIcon={<RefreshIcon />} size="small" onClick={onRefresh}>{t("refresh")}</Button>
    </Box>
  );
}

export default function TrackingHistoryPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("trackingHistoryPage");
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [items, setItems] = useState<trackingApi.TrackingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterOrderCode] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemFull, setItemFull] = useState<trackingApi.TrackingHistoryItem | null>(null);

  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const claims = useMemo(() => getAuthClaimsFromStorage(), []);
  const userCode = String(claims?.EmployeeCode ?? "");
  const roleId = claims && claims.EmployeeRoleId != null ? Number(claims.EmployeeRoleId) : undefined;

  const isFullAccess = roleId === 1 || roleId === 4;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (!isFullAccess && !userCode) {
        console.warn("No EmployeeCode in token - refusing to load tracking histories for safety (no full access).");
        setItems([]);
        setLoading(false);
        return;
      }

      const params: Record<string, any> = { page: 1, pageSize: 1000 };

      if (filterOrderCode) params.orderCode = filterOrderCode;
      if (search) params.q = search;

      if (!isFullAccess) {
        params.currentAssign = userCode;
      } else {
      }

      const resp = await trackingApi.getTrackingHistories(params);
      let data = resp.data ?? [];

      if (!isFullAccess && userCode) {
        data = data.filter((it: any) => String(it.currentAssign ?? "") === String(userCode));
      }

      setItems(data);
      const pendingCount = data.filter((it: any) => {
        const status = String(it.newStatus ?? "").toLowerCase();
        return status !== "completed" && status !== "cancelled";
      }).length;

      dispatch(setPendingTrackingCount(pendingCount));
    } catch (err) {
      console.error("getTrackingHistories failed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterOrderCode, search, isFullAccess, userCode]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (drawerOpen) return;

    const interval = setInterval(() => {
      fetchAll();
    }, 5000); // 5 giây

    return () => {
      clearInterval(interval);
    };
  }, [fetchAll, drawerOpen]);
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
        if (curTime > prevTime) map.set(key, it);
        else if (curTime === prevTime) {
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

  const olderEntriesFor = useCallback((orderCode: string, latestId?: number) => {
    return items.filter((it) => it.orderCode === orderCode && it.trackingHistoryId !== latestId).sort((a, b) => {
      const ta = a.createAt ? new Date(a.createAt).getTime() : 0;
      const tb = b.createAt ? new Date(b.createAt).getTime() : 0;
      if (ta !== tb) return tb - ta;
      return Number(b.trackingHistoryId ?? 0) - Number(a.trackingHistoryId ?? 0);
    });
  }, [items]);

  const toggleExpand = (orderCode: string) => setExpandedOrders((s) => ({ ...s, [orderCode]: !s[orderCode] }));

  const flattenedRows = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    const filteredLatest = latestPerOrder.filter((r) => {
      if (filterOrderCode) {
        if (!r.orderCode) return false;
        if (!String(r.orderCode).includes(filterOrderCode)) return false;
      }
      if (!q) return true;
      return String(r.orderCode ?? "").toLowerCase().includes(q)
        || String(r.actionType ?? "").toLowerCase().includes(q)
        || String(r.newStatus ?? "").toLowerCase().includes(q)
        || String(r.oldStatus ?? "").toLowerCase().includes(q)
        || String(r.currentAssign ?? "").toLowerCase().includes(q)
        || String(r.nextAssign ?? "").toLowerCase().includes(q);
    });

    const rows: any[] = [];
    for (const latest of filteredLatest) {
      rows.push({ ...latest, _isChild: false });
      const orderCode = latest.orderCode!;
      if (expandedOrders[orderCode]) {
        const older = olderEntriesFor(orderCode, latest.trackingHistoryId);
        for (const child of older) {
          rows.push({ ...child, _isChild: true, _rowId: `child-${latest.trackingHistoryId}-${child.trackingHistoryId}`, _parentId: latest.trackingHistoryId });
        }
      }
    }
    return rows;
  }, [latestPerOrder, expandedOrders, search, filterOrderCode, olderEntriesFor]);

  const columns = useMemo<GridColDef<any, any, any>[]>(() => [
    {
      field: "trackingHistoryId",
      headerName: t("id"),
      width: 100,
      renderCell: (params: any) => params.row._isChild ? <Typography variant="body2" sx={{ ml: 2 }}>{params.value}</Typography> : <Typography variant="body2">{params.value}</Typography>
    },
    {
      field: "orderCode",
      headerName: t("order"),
      minWidth: 200,
      flex: 1,
      renderCell: (params: any) => {
        const isChild = params.row._isChild;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: isChild ? 500 : 700, fontSize: isChild ? 13 : 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ml: isChild ? 2 : 0 }} title={String(params.value ?? "")}>
              {params.value ?? "-"}
            </Typography>
            <Tooltip title={t("copyOrderCode")}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(String(params.value ?? "")); }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: "actionType",
      headerName: t("details"),
      minWidth: 200,
      flex: 1,
      renderCell: (params: any) => {
        const raw = String(params.value ?? "");
        const translated = translateActionType(t, raw);
        return params.row._isChild ? (
          <Tooltip title={raw || "-"}>
            <Typography variant="body2" sx={{ ml: 2 }}>{translated || raw}</Typography>
          </Tooltip>
        ) : (
          <Tooltip title={raw || "-"}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{translated || raw}</Typography>
          </Tooltip>
        );
      }
    },
    {
      field: "oldStatus",
      headerName: t("oldStatus"),
      minWidth: 120,
      flex: 0.6,
      renderCell: (p: any) => {
        const raw = String(p.value ?? "");
        const translated = translateStatus(t, raw);
        return (
          <Tooltip title={raw || "-"}><span style={{ marginLeft: p.row._isChild ? 8 : 0 }}>{translated || "-"}</span></Tooltip>
        );
      }
    },
    {
      field: "newStatus",
      headerName: t("newStatus"),
      minWidth: 120,
      flex: 0.6,
      renderCell: (p: any) => {
        const raw = String(p.value ?? "");
        const translated = translateStatus(t, raw);
        return (
          <Tooltip title={raw || "-"}><span style={{ marginLeft: p.row._isChild ? 8 : 0 }}>{translated || "-"}</span></Tooltip>
        );
      }
    },
    {
      field: "currentAssign",
      headerName: t("currentAssign"),
      minWidth: 160,
      flex: 0.7,
      renderCell: (p: any) => p.row._isChild ? <Typography variant="body2" sx={{ ml: 2 }}>{String(p.value ?? "-")}</Typography> : <span>{String(p.value ?? "-")}</span>
    },
    {
      field: "nextAssign",
      headerName: t("nextAssign"),
      minWidth: 160,
      flex: 0.7,
      renderCell: (p: any) => p.row._isChild ? <Typography variant="body2" sx={{ ml: 2 }}>{String(p.value ?? "-")}</Typography> : <span>{String(p.value ?? "-")}</span>
    },
    {
      field: "createAt",
      headerName: t("created"),
      minWidth: 160,
      flex: 0.9,
      renderCell: (p: any) => p.row._isChild ? <Typography variant="body2" sx={{ ml: 2 }}>{fmtDate(p.value)}</Typography> : <span>{fmtDate(p.value)}</span>
    },
    {
      field: "actions",
      headerName: t("actionType"),
      width: 140,
      sortable: false,
      renderCell: (params: any) => {
        const isChild = params.row._isChild;
        const orderCode = params.row.orderCode as string | undefined;
        const isLatestRow = !isChild;
        return (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title={t("viewDetails")}>
              <span>
                <IconButton size="small" onClick={() => openDrawerFor(params.row)} aria-label="details"><VisibilityIcon fontSize="small" /></IconButton>
              </span>
            </Tooltip>

            {isLatestRow && orderCode && (
              <Tooltip title={expandedOrders[orderCode] ? t("collapse") : t("showHistory")}>
                <span>
                  <IconButton size="small" onClick={() => { toggleExpand(orderCode); }}>
                    {expandedOrders[orderCode] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ], [expandedOrders, fmtDate, t]);

  const getRowId = (r: any) => r._rowId ?? r.trackingHistoryId;

  const handleExportCsv = () => {
    if (!latestPerOrder || latestPerOrder.length === 0) return;
    const rows = latestPerOrder;
    const keys = [
      "trackingHistoryId",
      "orderCode",
      "actionType",
      "actionType_translated",
      "oldStatus",
      "oldStatus_translated",
      "newStatus",
      "newStatus_translated",
      "currentAssign",
      "nextAssign",
      "createAt",
      "image"
    ];
    const header = keys.join(",");
    const csv = [header].concat(rows.map((r) => {
      const oldRaw = (r as any)["oldStatus"] ?? "";
      const newRaw = (r as any)["newStatus"] ?? "";
      const oldT = translateStatus(t, oldRaw);
      const newT = translateStatus(t, newRaw);
      const actionRaw = (r as any)["actionType"] ?? "";
      const actionT = translateActionType(t, actionRaw);
      const record: Record<string, any> = {
        trackingHistoryId: r.trackingHistoryId ?? "",
        orderCode: r.orderCode ?? "",
        actionType: actionRaw,
        actionType_translated: actionT,
        oldStatus: oldRaw,
        oldStatus_translated: oldT,
        newStatus: newRaw,
        newStatus_translated: newT,
        currentAssign: r.currentAssign ?? "",
        nextAssign: r.nextAssign ?? "",
        createAt: r.createAt ?? "",
        image: r.image ?? "",
      };
      return keys.map((k) => {
        const v = record[k];
        if (v == null) return "";
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",");
    })).join("\n");
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
        <Typography variant="h4" fontWeight={700}>{t("title")}</Typography>
        <Typography color="text.secondary">{t("subtitle")}</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField placeholder={`${t("order")} / action / status...`} size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }} />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="text" onClick={() => setDensity(density === "standard" ? "compact" : "standard")}>{t("toggleDensity")}</Button>
              <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>{t("export")}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToolbarExtras onExport={handleExportCsv} onRefresh={fetchAll} />

          {isSm ? (
            <Stack spacing={2}>
              {latestPerOrder.filter((r) => {
                if (filterOrderCode) {
                  if (!r.orderCode) return false;
                  if (!String(r.orderCode).includes(filterOrderCode)) return false;
                }
                const q = (search ?? "").trim().toLowerCase();
                if (!q) return true;
                return String(r.orderCode ?? "").toLowerCase().includes(q) || String(r.actionType ?? "").toLowerCase().includes(q) || String(r.newStatus ?? "").toLowerCase().includes(q) || String(r.oldStatus ?? "").toLowerCase().includes(q) || String(r.currentAssign ?? "").toLowerCase().includes(q) || String(r.nextAssign ?? "").toLowerCase().includes(q);
              }).map((latest) => {
                const orderCode = latest.orderCode!;
                const expanded = !!expandedOrders[orderCode];
                const older = olderEntriesFor(orderCode, latest.trackingHistoryId);

                const actionTranslated = translateActionType(t, String(latest.actionType ?? ""));
                const newStatusTranslated = translateStatus(t, String(latest.newStatus ?? ""));
                const currentAssign = latest.currentAssign ?? "-";
                const nextAssign = latest.nextAssign ?? "-";

                return (
                  <Card key={latest.trackingHistoryId} variant="outlined">
                    <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography fontWeight={700}>{actionTranslated ?? (latest.actionType ?? `#${latest.trackingHistoryId}`)}</Typography>
                        <Typography color="text.secondary">
                          {latest.orderCode ?? "-"} • {fmtDate(latest.createAt)} • {t("new")}: {newStatusTranslated || (latest.newStatus ?? "-")} • {t("curr")}: {currentAssign} → {nextAssign}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title={t("viewDetails")}>
                          <IconButton size="small" onClick={() => openDrawerFor(latest)}><VisibilityIcon /></IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => toggleExpand(orderCode)}>{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                      </Box>
                    </CardContent>
                    {expanded && older.map((o) => (
                      <CardContent key={o.trackingHistoryId} sx={{ borderTop: "1px solid #eee" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography fontWeight={600} sx={{ fontSize: 13 }}>{translateActionType(t, String(o.actionType ?? "")) ?? (o.actionType ?? `#${o.trackingHistoryId}`)}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                              {fmtDate(o.createAt)} • {translateStatus(t, String(o.oldStatus ?? "")) || (o.oldStatus ?? "-")} → {translateStatus(t, String(o.newStatus ?? "")) || (o.newStatus ?? "-")} • {o.currentAssign ?? "-"} → {o.nextAssign ?? "-"}
                            </Typography>
                          </Box>
                          <Button size="small" onClick={() => openDrawerFor(o)}>{t("details")}</Button>
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

      <TrackingHistoryDetailDrawer trackingId={selectedId} open={drawerOpen} onClose={closeDrawer} item={itemFull ?? undefined} onActionComplete={async () => { await fetchAll(); }} />
    </Box>
  );
}
