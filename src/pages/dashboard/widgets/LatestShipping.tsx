import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";

import {
  getTrackingHistories,
  type TrackingHistoryItem,
} from "@/api/trackingHistoryApi";
import TrackingHistoryDetailDrawer from "@/pages/trackingHistory/components/TrackingHistoryDetailDrawer";
import {
  canonicalStatusKey,
  translateStatus,
  translateActionType,
  canonicalActionTypeKey,
} from "@/utils/translationHelpers";
export default function LatestShipping() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); 

  const [items, setItems] = useState<TrackingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemFull, setItemFull] = useState<TrackingHistoryItem | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getTrackingHistories({ page: 1, pageSize: 500 });
      setItems(resp.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fmtDate = (v: any) => (v ? String(v) : t("noData"));

  const normalize = (s?: string | null) =>
    (s ?? "").toString().trim().toLowerCase();

  const statusColorMap: Record<string, string> = {
    pending: "#0f62fe", 
    "wait pick up": "#0f62fe", 
    verify: "#99cfff",
    checkout: "#ff6b6b", 
    "pick up": "#a259ff", 
    processing: "#f5a623", 
    renting: "#ff4d4f", 
    stored: "#ff4d4f", 
    retrieved: "#2ecc71", 
    overdue: "#5b3a29", 
    "store in expired storage": "#7a0b0b",
    default: "#bdbdbd",
  };

  const statusKeyMap: Record<string, string> = {
    "processing order": "processing",
    "order retrieved": "retrieved",
    "order created": "pending",
    pending: "pending",
    processing: "processing",
    retrieved: "retrieved",
    "wait pick up": "wait pick up",
    verify: "verify",
    checkout: "checkout",
    "pick up": "pick up",
    renting: "renting",
    stored: "stored",
    overdue: "overdue",
    "store in expired storage": "store in expired storage",
  };

  const canonicalStatusKey = (s?: string | null) => {
    const n = normalize(s);
    if (!n) return "";
    return statusKeyMap[n] ?? n; 
  };

  const translateStatus = (s?: string | null) => {
    const key = canonicalStatusKey(s);
    if (!key) return t("noData");
    const looked = t(`statusNames.${key}`);
    return looked !== `statusNames.${key}` ? looked : key;
  };

  const latest = useMemo(() => {
    const map = new Map<string, TrackingHistoryItem>();
    for (const it of items) {
      const key = it.orderCode ?? String(it.trackingHistoryId);
      const prev = map.get(key);

      if (!prev) map.set(key, it);
      else {
        const a = prev.createAt ? new Date(prev.createAt).getTime() : 0;
        const b = it.createAt ? new Date(it.createAt).getTime() : 0;
        if (b > a) map.set(key, it);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => {
        const aa = a.createAt ? new Date(a.createAt).getTime() : 0;
        const bb = b.createAt ? new Date(b.createAt).getTime() : 0;
        return bb - aa;
      })
      .slice(0, 5);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return latest;
    return latest.filter((it) =>
      String(it.orderCode ?? "").toLowerCase().includes(q) ||
      String(it.newStatus ?? "").toLowerCase().includes(q) ||
      String(it.actionType ?? "").toLowerCase().includes(q)
    );
  }, [latest, search]);

  const openDrawerFor = (row: TrackingHistoryItem) => {
    setSelectedId(row.trackingHistoryId);
    setItemFull(row);
    setDrawerOpen(true);
  };

  const columns: any[] = useMemo(() => {
    if (isXs) {
      return [
        {
          field: "summary",
          headerName: "",
          flex: 1,
          minWidth: 300,
          sortable: false,
          renderCell: (params: any) => {
            const row = params?.row as TrackingHistoryItem | undefined;
            if (!row) return null;

            const canKey = canonicalStatusKey(row.newStatus);
            const label = translateStatus(row.newStatus);
            const color = statusColorMap[canKey] ?? statusColorMap.default;

            return (
              <Box sx={{ width: "100%", pr: 1 }}>
                <Stack spacing={0.4}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={700} sx={{ fontSize: 14 }} noWrap>
                      {row.orderCode ?? `#${row.trackingHistoryId}`}
                    </Typography>

                    <Button
                      size="small"
                      onClick={() => openDrawerFor(row)}
                      startIcon={<VisibilityIcon />}
                    >
                      View
                    </Button>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    <Chip
                      label={label}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: 12,
                        backgroundColor: color,
                        color: "#fff",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
  {translateActionType(t, row.actionType)}
</Typography>
                  </Box>

                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      From:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.currentAssign ?? "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      →
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.nextAssign ?? "-"}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {fmtDate(row.createAt)}
                  </Typography>
                </Stack>
              </Box>
            );
          },
        },
      ];
    }

    return [
      { field: "orderCode", headerName: t("order"), width: 150 },
      {
  field: "actionType",
  headerName: t("details"),
  flex: 1,
  minWidth: 160,
  renderCell: (params: any) => {
    const row = params?.row as TrackingHistoryItem | undefined;
    if (!row) return null;
    const translated = translateActionType(t, row.actionType);
    return <Typography variant="body2" noWrap>{translated}</Typography>;
  },
},
      {
        field: "newStatus",
        headerName: t("status"),
        width: 180,
        renderCell: (params: any) => {
          const row = params?.row as TrackingHistoryItem | undefined;
          if (!row) return null;
          const canKey = canonicalStatusKey(row.newStatus);
          const label = translateStatus(row.newStatus);
          const color = statusColorMap[canKey] ?? statusColorMap.default;
          return (
            <Box>
              <Chip
                label={label}
                size="small"
                sx={{
                  height: 26,
                  fontSize: 13,
                  backgroundColor: color,
                  color: "#fff",
                }}
              />
            </Box>
          );
        },
      },
      { field: "currentAssign", headerName: t("from"), width: 140 },
      { field: "nextAssign", headerName: t("to"), width: 140 },
      {
        field: "createAt",
        headerName: t("created"),
        width: 160,
        renderCell: (p: any) => fmtDate(p?.value),
      },
      {
        field: "actions",
        headerName: "",
        width: 120,
        sortable: false,
        renderCell: (params: any) => {
          const row = params?.row as TrackingHistoryItem | undefined;
          return (
            <Button
              size="small"
              onClick={() => row && openDrawerFor(row)}
              startIcon={<VisibilityIcon />}
            >
              {t("view")}
            </Button>
          );
        },
      },
    ];
  }, [isXs, t]);

  return (
    <Box sx={{ width: "100%", px: 0 }}>
      <Typography variant={isXs ? "subtitle1" : "h6"} fontWeight={700} mb={1.5}>
        {t("latestTrackingHistories")}
      </Typography>

      <Card sx={{ mb: 2, width: "100%", overflow: "visible" }} elevation={0}>
        <CardContent sx={{ p: isXs ? 1 : 2 }}>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            <DataGrid
              autoHeight
              loading={loading}
              rows={filtered}
              columns={columns}
              getRowId={(r: any) => r.trackingHistoryId}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              rowHeight={isXs ? 112 : 52}
              sx={{
                border: "none",
                ".MuiDataGrid-cellContent": {
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                },
                "& .MuiDataGrid-cell": {
                  py: isXs ? "8px" : undefined,
                },
              }}
              density={isXs ? "comfortable" : "standard"}
            />
          </Box>
        </CardContent>
      </Card>

      <TrackingHistoryDetailDrawer
        trackingId={selectedId}
        item={itemFull ?? undefined}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={fetchAll}
      />
    </Box>
  );
}
