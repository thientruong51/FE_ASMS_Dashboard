import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import priceApi, { type PricingItem, type ShippingRateItem } from "@/api/priceApi";
import PricingDetailDrawer from "./components/PricingDetailDrawer";
import priceI18nHelper from "@/utils/priceI18nHelper";
import PricingFormDialog from "./components/PricingFormDialog";

function a11yProps(index: number) {
  return {
    id: `price-tab-${index}`,
    "aria-controls": `price-tabpanel-${index}`,
  };
}

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

export default function PricePage() {
  const { t, i18n } = useTranslation("pricing");
  const [pricings, setPricings] = useState<PricingItem[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PricingItem | ShippingRateItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const normalizeArray = <T,>(resp: any): T[] => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp as T[];
    if (Array.isArray(resp.data)) return resp.data as T[];
    if (Array.isArray(resp.data?.data)) return resp.data.data as T[];
    const arr = Object.values(resp).find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr as T[];
    return [];
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const pricingsResp = await priceApi.getPricings({ page: 1, pageSize: 1000 }).catch((e) => {
        console.error("[PricePage] getPricings error", e);
        return null;
      });

      const items = normalizeArray<PricingItem>(pricingsResp);
      console.debug("[PricePage] normalized pricings count:", items.length, "raw:", pricingsResp);

      setPricings(items);

      const types = Array.from(new Set(items.map((p) => String(p.serviceType ?? "").trim()).filter((s) => !!s)));
      setServiceTypes(types);

      const shippingResp = await priceApi.getShippingRates({ page: 1, pageSize: 1000 }).catch((e) => {
        console.error("[PricePage] getShippingRates error", e);
        return null;
      });

      const srs = normalizeArray<ShippingRateItem>(shippingResp);
      console.debug("[PricePage] normalized shippingRates count:", srs.length, "raw:", shippingResp);

      setShippingRates(srs);
    } catch (err) {
      console.error("[PricePage] fetchAll caught error:", err);
      setPricings([]);
      setShippingRates([]);
      setServiceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const { pricings: enrichedPricings, shippingRates: enrichedShipping } = useMemo(() => {
    return priceI18nHelper.enrichAllWithI18n(pricings, shippingRates, t, {
      namespacePrefix: "pricing",
      locale: i18n.language === "en" ? "en-US" : "vi-VN",
      includeBothLanguages: false,
    });
  }, [pricings, shippingRates, t, i18n.language]);

  const totalServiceTabs = serviceTypes.length;
  const shippingTabIndex = totalServiceTabs + 1;
  const isShippingTab = tabIndex === shippingTabIndex;
  const isAllTab = tabIndex === 0;
  const currentServiceType = isAllTab ? null : serviceTypes[tabIndex - 1] ?? null;

  const currentPricings = useMemo(() => {
    if (isShippingTab) return [];
    if (isAllTab) return enrichedPricings;
    if (!currentServiceType) return [];
    return enrichedPricings.filter((p: any) => p.serviceType === currentServiceType);
  }, [enrichedPricings, serviceTypes, tabIndex, isShippingTab, isAllTab, currentServiceType]);

  const filteredCurrent = useMemo(() => {
    const q = (search ?? "").trim().toLowerCase();

    if (isShippingTab) {
      return enrichedShipping
        .filter((r: any) => {
          if (!q) return true;
          return (
            String(r.distanceRangeDisplay_t ?? r.distanceRangeDisplay ?? "").toLowerCase().includes(q) ||
            String(r.containerQtyDisplay_t ?? r.containerQtyDisplay ?? "").toLowerCase().includes(q) ||
            String(r.basePrice ?? "").toLowerCase().includes(q)
          );
        })
        .map((r: any) => ({ id: `sr-${r.shippingRateId}`, ...r }));
    }

    return currentPricings
      .filter((p: any) => {
        if (!q) return true;
        return (
          String(p.itemCode_t ?? p.itemCode ?? "").toLowerCase().includes(q) ||
          String(p.additionalInfo_t ?? p.additionalInfo ?? "").toLowerCase().includes(q) ||
          String(p.serviceType_t ?? p.serviceType ?? "").toLowerCase().includes(q)
        );
      })
      .map((p: any) => ({ id: p.pricingId, ...p }));
  }, [search, currentPricings, enrichedShipping, isShippingTab, i18n.language]);

  console.debug("[PricePage] filteredCurrent sample (3):", filteredCurrent.slice(0, 3));

  const currencyFromLocale = (n?: number | null) => {
    if (n == null) return "-";
    try {
      const locale = i18n.language === "en" ? "en-US" : "vi-VN";
      const symbol = i18n.language === "en" ? "VND" : "₫";
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n) + " " + symbol;
    } catch {
      return String(n);
    }
  };

  const handleExportCsv = () => {
    if (isShippingTab) {
      if (!shippingRates || shippingRates.length === 0) return;
      const keys = [
        "shippingRateId",
        "distanceRangeDisplay",
        "containerQtyDisplay",
        "basePrice",
        "priceUnit",
        "specialItemSurcharge",
        "monthlyRentalDiscount",
        "createdDate",
        "isActive",
      ];
      const header = keys.join(",");
      const csv = [header]
        .concat(
          shippingRates.map((r) =>
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
      a.download = `shipping_rates_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!currentPricings || currentPricings.length === 0) return;
    const keys = [
      "pricingId",
      "serviceType",
      "itemCode",
      "hasAirConditioning",
      "pricePerMonth",
      "pricePerWeek",
      "pricePerTrip",
      "additionalInfo",
      "createdDate",
      "updatedDate",
      "isActive",
    ];
    const header = keys.join(",");
    const csv = [header]
      .concat(
        currentPricings.map((r: any) =>
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
    a.download = `${(currentServiceType ?? "pricing").toLowerCase()}_pricing_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDrawerFor = (row: any) => {
    if (!row) return;
    setSelected(row);
    setDrawerOpen(true);
  };

  const langShort = (i18n.language ?? "vi").split("-")[0] || "vi";
  const priceMonthField = `pricePerMonth_display_${langShort}`;
  const priceWeekField = `pricePerWeek_display_${langShort}`;
  const priceTripField = `pricePerTrip_display_${langShort}`;

  const basePricingColumns: GridColDef[] = [
    { field: "pricingId", headerName: t("table.id") ?? "ID", minWidth: 90, flex: 0.4 },
    {
      field: "itemCode_t",
      headerName: t("table.itemCode") ?? "Item",
      minWidth: 140,
      flex: 1,
      renderCell: (params: any) => params?.value ?? params?.row?.itemCode ?? "-",
    },
    {
      field: "hasAirConditioning_t",
      headerName: t("table.ac") ?? "AC",
      minWidth: 90,
      flex: 0.4,
      renderCell: (p: any) => (p?.value == null || p?.value === "" ? "-" : p.value),
    },
    {
      field: priceMonthField,
      headerName: t("table.month") ?? "Price / month",
      minWidth: 140,
      flex: 1,
      renderCell: (params: any) => {
        const v = params?.value ?? params?.row?.pricePerMonth ?? params?.row?.__full?.pricePerMonth;
        if (typeof v === "string" && v.trim() !== "") return <span>{v}</span>;
        return <span>{currencyFromLocale(v as number | null)}</span>;
      },
    },
    {
      field: priceWeekField,
      headerName: t("table.week") ?? "Price / week",
      minWidth: 140,
      flex: 1,
      renderCell: (params: any) => {
        const v = params?.value ?? params?.row?.pricePerWeek ?? params?.row?.__full?.pricePerWeek;
        if (typeof v === "string" && v.trim() !== "") return <span>{v}</span>;
        return <span>{currencyFromLocale(v as number | null)}</span>;
      },
    },
    {
      field: priceTripField,
      headerName: t("table.trip") ?? "Price / trip",
      minWidth: 140,
      flex: 1,
      renderCell: (params: any) => {
        const v = params?.value ?? params?.row?.pricePerTrip ?? params?.row?.__full?.pricePerTrip;
        if (typeof v === "string" && v.trim() !== "") return <span>{v}</span>;
        return <span>{currencyFromLocale(v as number | null)}</span>;
      },
    },
    {
      field: "additionalInfo_t",
      headerName: t("table.info") ?? "Info",
      minWidth: 220,
      flex: 1.5,
      renderCell: (p: any) => (p?.value ? <span style={{ whiteSpace: "normal" }}>{p.value}</span> : "-"),
    },
    {
      field: "actions",
      headerName: t("table.actions") ?? "Actions",
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title={t("actions.view") ?? "View"}>
            <span>
              <IconButton size="small" onClick={() => openDrawerFor(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const baseShippingColumns: GridColDef[] = [
    { field: "shippingRateId", headerName: t("table.id") ?? "ID", minWidth: 90, flex: 0.4 },
    {
      field: "distanceRangeDisplay_t",
      headerName: t("table.distance") ?? "Distance",
      minWidth: 160,
      flex: 1,
      renderCell: (p: any) => p?.value ?? p?.row?.distanceRangeDisplay ?? "-",
    },
    {
      field: "containerQtyDisplay_t",
      headerName: t("table.containerQty") ?? "Container",
      minWidth: 160,
      flex: 1,
      renderCell: (p: any) => p?.value ?? p?.row?.containerQtyDisplay ?? "-",
    },
    {
      field: `basePrice_display_${langShort}`,
      headerName: t("table.basePrice") ?? "Base price",
      minWidth: 140,
      flex: 1,
      renderCell: (params: any) => {
        const v = params?.value ?? params?.row?.basePrice;
        if (typeof v === "string" && v.trim() !== "") return <span>{v}</span>;
        return <span>{currencyFromLocale(v as number | null)}</span>;
      },
    },
    { field: "priceUnit_t", headerName: t("table.priceUnit") ?? "Unit", minWidth: 120, flex: 0.8, renderCell: (p: any) => p?.value ?? p?.row?.priceUnit ?? "-" },
    {
      field: "actions",
      headerName: t("table.actions") ?? "Actions",
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title={t("actions.view") ?? "View"}>
            <span>
              <IconButton size="small" onClick={() => openDrawerFor(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const columnHasData = (field: string, rows: any[]) => {
    if (!rows || rows.length === 0) return false;
    for (const r of rows) {
      const top = r[field];
      if (top !== null && top !== undefined && top !== "") return true;
      if (field === "itemCode" && (r["itemCode_t"] || r["itemCode"])) return true;
      if (field === "additionalInfo" && (r["additionalInfo_t"] || r["additionalInfo"])) return true;
      if (field === "hasAirConditioning" && (r["hasAirConditioning_t"] || r["hasAirConditioning"] !== undefined)) return true;
      if (field.startsWith("pricePer") && (r[`pricePerMonth_display_${langShort}`] || r[`pricePerWeek_display_${langShort}`] || r[`pricePerTrip_display_${langShort}`])) return true;
      if (r.__full) {
        const nested = r.__full[field];
        if (nested !== null && nested !== undefined && nested !== "") return true;
      }
    }
    return false;
  };

  const visibleColumns = useMemo(() => {
    const rows = filteredCurrent;
    const base = isShippingTab ? baseShippingColumns : basePricingColumns;

    const actionsField = "actions";
    return base.filter((col) => {
      if (col.field === actionsField) return true;

      if (!isShippingTab && [priceMonthField, priceWeekField, priceTripField].includes(String(col.field))) {
        return columnHasData(String(col.field), rows);
      }

      return columnHasData(String(col.field), rows);
    });
  }, [filteredCurrent, isShippingTab, priceMonthField, priceWeekField, priceTripField, langShort]);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box
        mb={2}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {t("page.title") ?? "Pricing"}
          </Typography>
          <Typography color="text.secondary">
            {t("page.subtitle") ?? "Manage pricing & shipping rates"}
          </Typography>
        </Box>

        {/* ADD BUTTON */}
        {!isShippingTab && (
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
          >
            {t("actions.addPricing")}
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              aria-label="pricing tabs"
              sx={{ flex: 1, minWidth: 240 }}
            >
              <Tab key="all" label={`${t("tabs.all") ?? "All"} (${pricings.length})`} {...a11yProps(0)} />
              {serviceTypes.map((st, idx) => (
                <Tab
                  key={st}
                  label={`${(enrichedPricings.find((p: any) => p.serviceType === st)?.serviceType_t ?? st)} (${pricings.filter((p) => p.serviceType === st).length})`}
                  {...a11yProps(idx + 1)}
                />
              ))}
              <Tab key="shipping" label={`${t("tabs.shipping") ?? "Shipping Rates"} (${shippingRates.length})`} {...a11yProps(shippingTabIndex)} />
            </Tabs>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
              <TextField
                size="small"
                placeholder={t("page.searchPlaceholder") ?? "Search..."}
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
              <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                {t("actions.export") ?? "Export"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToolbarExtras
            onExport={handleExportCsv}
            onRefresh={fetchAll}
            exportLabel={t("actions.exportCsv") ?? "Export CSV"}
            refreshLabel={t("actions.refresh") ?? "Refresh"}
          />

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={filteredCurrent as any[]}
                columns={visibleColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50, 100]}
                loading={loading}
                getRowId={(r: any) => r.id ?? r.pricingId ?? `sr-${r.shippingRateId}`}
                density="standard"
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => openDrawerFor(params.row)}
                sx={{ border: "none", minWidth: 700 }}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      <PricingDetailDrawer
        item={selected}
        itemIsShipping={Boolean(selected && (selected as any).shippingRateId != null)}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        onRefresh={fetchAll}
      />
      <PricingFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          fetchAll(); 
        }}
      />
    </Box>
  );
}
