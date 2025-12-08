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
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import BusinessRuleDetailDrawer, { type BusinessRuleItem } from "./components/BusinessRuleDetailDrawer";
import { useTranslation } from "react-i18next";
import * as businessRulesApi from "@/api/businessRulesApi";

export default function BusinessRulesPage() {
  const { t } = useTranslation("businessRules");
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [items, setItems] = useState<BusinessRuleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemFull, setItemFull] = useState<BusinessRuleItem | null>(null);

  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");

  const fetchAll = useCallback(async () => {
  setLoading(true);
  try {
    const resp = await businessRulesApi.getBusinessRules?.({ page: 1, pageSize: 1000 });
    const data = (resp && (resp as any).data) ?? (resp as any) ?? [];

    const mapped = (data as BusinessRuleItem[]).map((r) => ({
      ...r,
      _displayCategory: t(`categories.${String(r.category)}`, { defaultValue: String(r.category ?? "") }),
      _displayPriority: t(`priorities.${String(r.priority)}`, { defaultValue: String(r.priority ?? "") }),
      _displayRuleType: t(`ruleTypes.${String(r.ruleType)}`, { defaultValue: String(r.ruleType ?? "") }),
      _displayIsActive: (r.isActive ? t("active") : t("inactive")),
      _displayEffectiveDate: r.effectiveDate ? fmtDate(r.effectiveDate) : "",
      _displayExpiryDate: r.expiryDate ? fmtDate(r.expiryDate) : "",
    }));
    setItems(mapped);
  } catch (err) {
    console.error("getBusinessRules failed", err);
    setItems([]);
  } finally {
    setLoading(false);
  }
}, [t]);


  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openDrawerFor = (row?: BusinessRuleItem) => {
    if (!row) {
      setSelectedId(null);
      setItemFull(null);
    } else {
      setSelectedId(row.businessRuleId ?? null);
      setItemFull(row);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setItemFull(null);
  };

  const fmtDate = (v: any) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString();
    } catch {
      return String(v);
    }
  };

  const i18nCategory = (val: any) => {
    if (val == null || val === "") return "-";
    return t(`categories.${String(val)}`, { defaultValue: String(val) });
  };

  const i18nPriority = (val: any) => {
    if (val == null || val === "") return "-";
    return t(`priorities.${String(val)}`, { defaultValue: String(val) });
  };

  const i18nRuleType = (val: any) => {
    if (val == null || val === "") return "-";
    return t(`ruleTypes.${String(val)}`, { defaultValue: String(val) });
  };

  const filtered = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      return (
        String(r.ruleCode ?? "").toLowerCase().includes(q) ||
        String(r.ruleName ?? "").toLowerCase().includes(q) ||
        String(r.category ?? "").toLowerCase().includes(q) ||
        String(r.ruleType ?? "").toLowerCase().includes(q) ||
        String(r.priority ?? "").toLowerCase().includes(q) ||
        String(r.ruleDescription ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "businessRuleId", headerName: t("id"), width: 100 },
      { field: "ruleCode", headerName: t("ruleCode"), minWidth: 160, flex: 0.8 },
      {
        field: "ruleName",
        headerName: t("ruleName"),
        minWidth: 200,
        flex: 1,
        renderCell: (p: GridRenderCellParams<any>) => <span style={{ fontWeight: 600 }}>{p.value ?? "-"}</span>,
      },
      {
        field: "category",
        headerName: t("category"),
        minWidth: 160,
        flex: 0.8,
        renderCell: (p: GridRenderCellParams<any>) => {
          const val = p.value ?? p.row?.category ?? "";
          return <span>{i18nCategory(val)}</span>;
        },
      },
      {
        field: "ruleType",
        headerName: t("ruleType"),
        minWidth: 120,
        flex: 0.6,
        renderCell: (p: GridRenderCellParams<any>) => {
          const val = p.value ?? p.row?.ruleType ?? "";
          return <span>{i18nRuleType(val)}</span>;
        },
      },
      {
        field: "priority",
        headerName: t("priority"),
        minWidth: 100,
        flex: 0.5,
        renderCell: (p: GridRenderCellParams<any>) => {
          const val = p.value ?? p.row?.priority ?? "";
          return <span>{i18nPriority(val)}</span>;
        },
      },
      {
        field: "isActive",
        headerName: t("isActive"),
        width: 120,
        renderCell: (p: GridRenderCellParams<any>) => (p.value ? t("active") : t("inactive")),
      },

      {
        field: "effectiveDate",
        headerName: t("effectiveDate"),
        minWidth: 160,
        flex: 0.9,
        renderCell: (p: GridRenderCellParams<any>) => {
          const val = p.value ?? p?.row?.effectiveDate ?? null;
          return <span>{fmtDate(val)}</span>;
        },
      },

      {
        field: "expiryDate",
        headerName: t("expiryDate"),
        minWidth: 160,
        flex: 0.9,
        renderCell: (p: GridRenderCellParams<any>) => {
          const val = p.value ?? p?.row?.expiryDate ?? null;
          return <span>{fmtDate(val)}</span>;
        },
      },

      {
        field: "actions",
        headerName: t("actions"),
        width: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams<any>) => {
          const row = params.row as BusinessRuleItem;
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title={t("viewDetails")}>
                <IconButton
                  size="small"
                  onClick={() => {
                    openDrawerFor(row);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("copyRuleCode")}>
                <IconButton size="small" onClick={() => navigator.clipboard?.writeText(String(row.ruleCode ?? ""))}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [t]
  );

  const getRowId = (r: any) => r.businessRuleId ?? `${r.ruleCode ?? "rc"}-${r.ruleName ?? "rn"}`;

  const handleExportCsv = () => {
    if (!filtered || filtered.length === 0) return;
    const keys = [
      "businessRuleId",
      "ruleCode",
      "ruleName",
      "category",
      "ruleDescription",
      "ruleType",
      "priority",
      "isActive",
      "effectiveDate",
      "expiryDate",
      "notes",
    ];
    const header = keys.join(",");
    const csv = [header].concat(
      filtered.map((r) => {
        const record: Record<string, any> = {};
        for (const k of keys) {
          let v = (r as any)[k] ?? "";
          // dịch các trường cần thiết trước khi xuất CSV bằng i18n
          if (k === "category") v = i18nCategory(v);
          if (k === "priority") v = i18nPriority(v);
          if (k === "ruleType") v = i18nRuleType(v);
          if (k === "isActive") v = v ? t("active") : t("inactive");
          if (k === "effectiveDate" || k === "expiryDate") v = v ? fmtDate(v) : "";
          record[k] = v;
        }
        return keys
          .map((k) => {
            const v = record[k];
            if (v == null) return "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(",");
      })
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business_rules_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={700}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">{t("subtitle")}</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                placeholder={`${t("ruleCode")} / ${t("ruleName")} / ${t("category")}`}
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
                {t("toggleDensity")}
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                {t("export")}
              </Button>
              <Button variant="contained" onClick={() => openDrawerFor()}>
                {t("newRule")}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
            <Button startIcon={<DownloadIcon />} size="small" onClick={handleExportCsv}>
              {t("exportCsv")}
            </Button>
            <Button startIcon={<RefreshIcon />} size="small" onClick={fetchAll}>
              {t("refresh")}
            </Button>
          </Box>

          {isSm ? (
            <Stack spacing={2}>
              {filtered.map((r) => (
                <Card key={r.businessRuleId ?? r.ruleCode} variant="outlined">
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography fontWeight={700}>{r.ruleName ?? r.ruleCode}</Typography>
                      <Typography color="text.secondary">
                        {r.ruleCode ?? "-"} • {i18nCategory(r.category)} • {i18nPriority(r.priority)} • {i18nRuleType(r.ruleType)}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title={t("viewDetails")}>
                        <IconButton size="small" onClick={() => openDrawerFor(r)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={filtered as any[]}
                columns={columns}
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

      <BusinessRuleDetailDrawer
        open={drawerOpen}
        id={selectedId}
        item={itemFull ?? undefined}
        onClose={closeDrawer}
        onSaved={async () => {
          await fetchAll();
        }}
      />
    </Box>
  );
}
