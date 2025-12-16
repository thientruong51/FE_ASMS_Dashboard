import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import dashboardApi, {
  type BuildingUsageItem,
  type OverallSummary,
} from "@/api/dashboardApi";
import BuildingUsageDrawer from "./components/BuildingUsageDrawer";
import { translateBuildingName } from "@/utils/buildingNames";

export default function BuildingUsagePage() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<BuildingUsageItem[]>([]);
  const [overall, setOverall] = useState<OverallSummary | null>(null);

  const [selected, setSelected] = useState<BuildingUsageItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getBuildingUsageSummary();
      if (res.data.success) {
        setBuildings(res.data.data.buildings);
        setOverall(res.data.data.overallSummary);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rows = useMemo(() => buildings, [buildings]);

  const openDrawer = (row: BuildingUsageItem) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  /* ======================
     Responsive columns
  ====================== */
  const columns = useMemo<GridColDef<BuildingUsageItem>[]>(() => {
    const base: GridColDef<BuildingUsageItem>[] = [
      {
        field: "buildingName",
        headerName: t("table.building") ?? "Building",
        flex: 1,
        minWidth: 140,
        renderCell: (params) =>
          translateBuildingName(t, params.value),
      },
      {
        field: "percentUsed",
        headerName: "%",
        width: 90,
        renderCell: (params) => {
          const v = params.row.percentUsed;
          if (v == null) return "-";
          return (
            <Chip
              size="small"
              label={`${v}%`}
              color={v >= 80 ? "error" : v >= 50 ? "warning" : "success"}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 60,
        sortable: false,
        renderCell: (params) => (
          <IconButton size="small" onClick={() => openDrawer(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        ),
      },
    ];

    if (isMobile) return base;

    return [
      base[0],
      {
        field: "buildingType",
        headerName: t("table.type") ?? "Type",
        minWidth: 120,
        renderCell: (params) =>
          t(`buildingTypeMap.${params.value}`, {
            defaultValue: params.value,
          }),
      },
      {
        field: "total",
        headerName: t("table.total") ?? "Total",
        minWidth: 130,
        valueGetter: (_v, row) =>
          row.storageTypeSummary
            ? `${row.storageTypeSummary.totalRooms} ${t("table.rooms")}`
            : row.totalVolume != null
            ? `${row.totalVolume} m³`
            : "-",
      },
      {
        field: "used",
        headerName: t("table.used") ?? "Used",
        minWidth: 130,
        valueGetter: (_v, row) =>
          row.storageTypeSummary
            ? `${row.storageTypeSummary.occupiedRooms} ${t("table.rooms")}`
            : row.usedVolume != null
            ? `${row.usedVolume} m³`
            : "-",
      },
      {
        field: "available",
        headerName: t("table.available") ?? "Available",
        minWidth: 140,
        valueGetter: (_v, row) =>
          row.totalVolume != null && row.usedVolume != null
            ? `${(row.totalVolume - row.usedVolume).toFixed(2)} m³`
            : "-",
      },
      base[1],
      {
        field: "details",
        headerName: t("table.details") ?? "Details",
        flex: 1.4,
        sortable: false,
        renderCell: (params) => {
          const r = params.row;
          if (!r.storageTypeDetails?.length) return "—";
          return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {r.storageTypeDetails.map((s) => (
                <Chip
                  key={s.storageTypeId}
                  size="small"
                  label={`${t(`storageTypeMap.${s.storageTypeName}`, {
                    defaultValue: s.storageTypeName,
                  })}: ${s.occupiedRooms}/${s.totalRooms}`}
                />
              ))}
            </Box>
          );
        },
      },
      base[2],
    ];
  }, [isMobile, t]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* ---------- HEADER ---------- */}
      <Box mb={2}>
        <Typography variant="h4" fontWeight={700}>
          {t("page.buildingUsage") ?? "Building Usage"}
        </Typography>
        <Typography color="text.secondary">
          {t("page.buildingUsageSubtitle") ??
            "Warehouse and self-storage usage overview"}
        </Typography>
      </Box>

      {/* ---------- OVERALL SUMMARY ---------- */}
      {overall && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3,1fr)",
                  md: "repeat(5,1fr)",
                },
                gap: 2,
              }}
            >
              <SummaryItem
                label={t("summary.buildings")}
                value={overall.totalBuildings}
              />
              <SummaryItem
                label={t("summary.storages")}
                value={overall.totalStorages}
              />
              <SummaryItem
                label={t("summary.usedVolume")}
                value={`${overall.usedVolume} m³`}
              />
              <SummaryItem
                label={t("summary.totalVolume")}
                value={`${overall.totalVolume} m³`}
              />
              <SummaryItem
                label={t("summary.percentUsed")}
                value={`${overall.percentUsed}%`}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ---------- TABLE ---------- */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Tooltip title={t("actions.refresh") ?? "Refresh"}>
              <IconButton onClick={fetchData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.buildingCode}
            autoHeight
            loading={loading}
            disableRowSelectionOnClick
            disableColumnMenu={isMobile}
            hideFooter={isMobile}
            rowHeight={isMobile ? 64 : 52}
            onRowClick={(p: GridRowParams<BuildingUsageItem>) =>
              isMobile && openDrawer(p.row)
            }
            sx={{
              border: "none",
              width: "100%",
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                lineHeight: 1.4,
              },
            }}
          />
        </CardContent>
      </Card>

      <BuildingUsageDrawer
        open={drawerOpen}
        building={selected}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
      />
    </Box>
  );
}

/* ======================
   Small component
====================== */
function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}
