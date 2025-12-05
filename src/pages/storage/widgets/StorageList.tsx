import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Autocomplete,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { getBuildings } from "@/api/buildingApi";
import { getStorages, type StorageRespItem } from "@/api/storageApi";
import type { Building } from "@/pages/building/components/types";

import { useTranslation } from "react-i18next";

import { translateBuildingName, canonicalBuildingKey } from "@/utils/buildingNames";
import { translateStatus, canonicalStatusKey } from "@/utils/statusHelper";
type Props = {
  onSelectStorage?: (s: StorageRespItem) => void;
  selectedStorage?: StorageRespItem | null;
};

export default function StorageList({ onSelectStorage, selectedStorage }: Props) {
  const { t } = useTranslation(["storagePage", "buildingNames"]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingInputValue, setBuildingInputValue] = useState<string>("");

  const [storages, setStorages] = useState<StorageRespItem[]>([]);
  const [loadingStorages, setLoadingStorages] = useState(false);
  const [storagesError, setStoragesError] = useState<string | null>(null);

  const [tab, setTab] = useState(0);
  const [searchText, setSearchText] = useState("");

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingBuildings(true);
        setBuildingsError(null);
        const resp = await getBuildings(1, 100);
        if (!mounted) return;
        setBuildings(resp.data ?? []);
      } catch (err: any) {
        setBuildingsError(err?.message ?? t("storageList.failedLoadBuildings"));
      } finally {
        if (mounted) setLoadingBuildings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  useEffect(() => {
    let mounted = true;
    if (!selectedBuilding) {
      setStorages([]);
      setStoragesError(null);
      return;
    }
    (async () => {
      try {
        setLoadingStorages(true);
        setStoragesError(null);
        const params: Record<string, any> = { page: 1, pageSize: 1000 };
        if (selectedBuilding.buildingCode) params.buildingCode = selectedBuilding.buildingCode;
        else if (selectedBuilding.buildingId != null) params.buildingId = selectedBuilding.buildingId;

        const resp = await getStorages(params);
        if (!mounted) return;
        setStorages(resp.data ?? []);
      } catch (err: any) {
        setStoragesError(err?.message ?? t("storageList.failedLoadStorages"));
      } finally {
        if (mounted) setLoadingStorages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedBuilding, t]);

  const filteredStorages = useMemo(() => {
    let list = storages.slice();
    if (tab === 1) list = list.filter((s) => /Loading/i.test(s.status ?? ""));
    if (tab === 2) list = list.filter((s) => /Unloading/i.test(s.status ?? ""));
    if (tab === 3) list = list.filter((s) => /Arriving/i.test(s.status ?? ""));
    if (tab === 4) list = list.filter((s) => /Preparing/i.test(s.status ?? ""));
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.storageCode ?? "").toLowerCase().includes(q) ||
          (s.storageTypeName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [storages, tab, searchText]);

 const colorMap: Record<string, string> = {
  arriving: "#fbc02d",
  loading: "#1976d2",
  unloading: "#2e7d32",
  available: "#0288d1",
  departed: "#757575",
  ready: "#2e7d32",
  active: "#3CBD96",
  reserved: "#ff9800",
  rented: "#8e24aa",
  occupied: "#d32f2f",
};

  const tabLabels = [
    t("storageList.tabAll"),
    t("storageList.tabLoading"),
    t("storageList.tabUnloading"),
    t("storageList.tabArriving"),
    t("storageList.tabPreparing"),
  ];

  const buildingOptions = useMemo(() => {
    return (buildings ?? []).map((b) => ({
      ...b,
      _label: translateBuildingName(t as any, b.name ?? null, undefined),
    }));
  }, [buildings, t]);

  const renderBuildingLabel = (b?: Building | null) => {
    if (!b) return t("storageList.buildingFallback");
    const anyB = b as any;
    if (anyB._label) return anyB._label;
    return translateBuildingName(t as any, b.name ?? null, undefined);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        overflow: "hidden",
        height: { xs: "auto", sm: "100%" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.2}
          flexDirection={isSmUp ? "row" : "column"}
          gap={isSmUp ? 0 : 1}
        >
          <Typography fontWeight={600} fontSize={15}>
            {t("storageList.title")}
          </Typography>

          <Box sx={{ width: isSmUp ? 320 : "100%" }}>
            {loadingBuildings ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography fontSize={13}>{t("storageList.loadingBuildings")}</Typography>
              </Box>
            ) : buildingsError ? (
              <Typography fontSize={13} color="error">
                {buildingsError}
              </Typography>
            ) : (
              <Autocomplete
                options={buildingOptions}
                getOptionLabel={(opt) => (opt ? String(opt._label ?? opt.name ?? opt.buildingCode ?? "") : "")}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.buildingId ?? opt.buildingCode ?? opt.name}>
                    <Box display="flex" flexDirection="column">
                      <Typography variant="body2">{opt._label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {String(opt.buildingCode ?? opt.buildingId ?? "")}
                      </Typography>
                    </Box>
                  </li>
                )}
                value={
                  selectedBuilding
                    ? 
                    { ...(selectedBuilding as any), _label: renderBuildingLabel(selectedBuilding) }
                    : null
                }
                onChange={(_, v) => {
                  setSelectedBuilding((v as Building | null));
                }}
                inputValue={buildingInputValue}
                onInputChange={(_, v) => setBuildingInputValue(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={t("storageList.selectBuildingPlaceholder")}
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <WarehouseIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(opt, val) => {
                  const idOpt = String(opt?.buildingId ?? opt?.buildingCode ?? "");
                  const idVal = String(val?.buildingId ?? val?.buildingCode ?? "");
                  if (idOpt && idVal) return idOpt === idVal;
                  try {
                    const k1 = canonicalBuildingKey(opt?.name ?? String(opt?.buildingCode ?? opt?.buildingId ?? ""));
                    const k2 = canonicalBuildingKey(val?.name ?? String(val?.buildingCode ?? val?.buildingId ?? ""));
                    return k1 === k2;
                  } catch {
                    return false;
                  }
                }}
                clearOnEscape
                fullWidth
                aria-label={t("storageList.buildingAutocompleteAria")}
              />
            )}
          </Box>
        </Box>

        {/* SUBHEADER */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
          flexDirection={isSmUp ? "row" : "column"}
          gap={isSmUp ? 0 : 1}
        >
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            {selectedBuilding ? t("storageList.showingFor", { name: renderBuildingLabel(selectedBuilding) }) : t("storageList.chooseBuilding")}
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5} width={isSmUp ? "auto" : "100%"}>
            <TextField
              size="small"
              placeholder={t("storageList.searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: isSmUp ? 260 : "100%" }}
              inputProps={{ "aria-label": t("storageList.searchAria") }}
            />
            <IconButton size="small" disabled aria-label={t("storageList.searchAria")}>
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* TABS */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 32,
            mb: 1.5,
            "& .MuiTab-root": {
              minHeight: 32,
              textTransform: "none",
              fontSize: 13,
              fontWeight: 500,
              px: 1.4,
              borderRadius: "8px",
              mr: 1,
            },
            "& .Mui-selected": {
              bgcolor: "rgba(25,118,210,0.08)",
              color: "primary.main",
            },
          }}
          aria-label={t("storageList.tabsAria")}
        >
          {tabLabels.map((label, i) => (
            <Tab key={i} label={label} />
          ))}
        </Tabs>

        {/* SCROLL AREA */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 1,
            pb: 1,
            maxHeight: { xs: "calc(70vh - 220px)", sm: "none" },
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": { background: "#c1c1c1", borderRadius: "8px" },
          }}
        >
          <Box display="flex" flexDirection="column" gap={1.5}>
            {loadingStorages ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography fontSize={13}>{t("storageList.loadingStorages")}</Typography>
              </Box>
            ) : storagesError ? (
              <Typography color="error">{storagesError}</Typography>
            ) : !selectedBuilding ? (
              <Typography fontSize={13} color="text.secondary">
                {t("storageList.selectBuildingToView")}
              </Typography>
            ) : filteredStorages.length === 0 ? (
              <Typography fontSize={13} color="text.secondary">
                {t("storageList.noStoragesFound")}
              </Typography>
            ) : (
              filteredStorages.map((v, i) => (
                <Card
                  key={v.storageCode ?? i}
                  variant="outlined"
                  onClick={() => onSelectStorage?.(v)}
                  sx={{
                    borderRadius: 2,
                    p: 1.25,
                    borderColor: (selectedStorage?.storageCode === v.storageCode) ? "#3CBD96" : "#e0e0e0",
                    cursor: "pointer",
                    transition: "0.18s",
                    "&:hover": { borderColor: "#3CBD96", bgcolor: "#f9fbff" },
                  }}
                  role="button"
                  aria-label={t("storageList.storageCardAria", { code: v.storageCode })}
                >
                  <Box display="flex" alignItems="center" mb={1} gap={1}>
                    <WarehouseIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography fontWeight={600} fontSize={13} sx={{ ml: 0.8, flex: 1 }} noWrap>
                      {v.storageCode}
                    </Typography>
                    <Chip
                      label={translateStatus(t as any, v.status) ?? (v.status ?? t("storageList.unknownStatus"))}
                      size="small"
                      sx={{
                        color: colorMap[canonicalStatusKey(v.status) ?? "ready"] ?? "text.primary",
                        borderColor: colorMap[canonicalStatusKey(v.status) ?? "ready"] ?? "#e0e0e0",
                        borderWidth: 1.3,
                        borderStyle: "solid",
                        fontSize: 12,
                        fontWeight: 500,
                        background: "transparent",
                        height: 22,
                        ml: 1,
                      }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box display="flex" alignItems="center" mb={0.35}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: "#3CBD96", mr: 1 }} />
                        <Typography fontSize={13} color="text.secondary" noWrap>
                          {t("storageList.type")}: {translateBuildingName(t as any, v.storageTypeName ?? null, undefined) ?? t("storageList.na")}
                        </Typography>

                        <Typography fontSize={13} color="text.secondary" sx={{ ml: "auto" }} noWrap>
                          {t("storageList.active")}: {v.isActive ? t("common.yes") : t("common.no")}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" mb={0.35} gap={1} flexWrap="wrap">
                        <Typography fontSize={13} color="text.secondary" noWrap>
                          {t("storageList.dimensions")}:
                        </Typography>
                        <Typography fontSize={13} color="text.secondary" noWrap>
                          {v.width ?? "-"} x {v.length ?? "-"} x {v.height ?? "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1} gap={0.5}>
                    <RoomOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {renderBuildingLabel(selectedBuilding)}
                    </Typography>
                  </Box>
                </Card>
              ))
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
