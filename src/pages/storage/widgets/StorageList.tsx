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
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import WarehouseIcon from "@mui/icons-material/Warehouse";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";

import { getBuildings } from "@/api/buildingApi";
import { getStorages, type StorageRespItem } from "@/api/storageApi";
import type { Building } from "@/pages/building/components/types";

import { useTranslation } from "react-i18next";

import { translateBuildingName } from "@/utils/buildingNames";
import { translateStatus, canonicalStatusKey } from "@/utils/statusHelper";

import { translateStorageTypeName } from "@/utils/storageTypeNames";

import CreateStorageDialog from "./CreateStorageDialog";

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
  const [buildingInputValue, setBuildingInputValue] = useState("");

  const [storages, setStorages] = useState<StorageRespItem[]>([]);
  const [loadingStorages, setLoadingStorages] = useState(false);
  const [storagesError, setStoragesError] = useState<string | null>(null);

  const [tab, setTab] = useState(0);
  const [searchText, setSearchText] = useState("");

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const [openCreate, setOpenCreate] = useState(false);
 const STORAGE_TABS = [
    { key: "all", label: t("storageList.tabAll") },
    { key: "ready", label: t("statusNames.ready") },
    { key: "reserved", label: t("statusNames.reserved") },
    { key: "rented", label: t("statusNames.rented") },
  ];
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

        const params: any = { page: 1, pageSize: 1000 };

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
    let list = [...storages];

    const tabKey = STORAGE_TABS[tab]?.key;

    // lọc theo status
    if (tabKey && tabKey !== "all") {
      list = list.filter(
        (s) => canonicalStatusKey(s.status) === tabKey
      );
    }

    // lọc theo search
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter((s) => {
        const nameTranslated =
          translateStorageTypeName(t as any, s.storageTypeName)
            ?.toLowerCase() ?? "";
        return (
          (s.storageCode ?? "").toLowerCase().includes(q) ||
          nameTranslated.includes(q)
        );
      });
    }

    return list;
  }, [storages, tab, searchText, t]);


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

 
  const buildingOptions = useMemo(() => {
    return (buildings ?? []).map((b) => ({
      ...b,
      _label: translateBuildingName(t as any, b.name ?? null, undefined),
    }));
  }, [buildings, t]);

  const renderBuildingLabel = (b?: Building | null) => {
    if (!b) return t("storageList.buildingFallback");
    const anyB = b as any;
    return anyB._label || translateBuildingName(t as any, b.name ?? null, undefined);
  };

  return (
    <Card sx={{ borderRadius: 3, bgcolor: "#fff", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: 0,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >

        {/* HEADER */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
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
              <Typography fontSize={13} color="error">{buildingsError}</Typography>
            ) : (
              <Autocomplete
                options={buildingOptions}
                getOptionLabel={(opt) => opt._label ?? ""}
                value={selectedBuilding ? { ...(selectedBuilding as any), _label: renderBuildingLabel(selectedBuilding) } : null}
                onChange={(_, v) => setSelectedBuilding(v as Building | null)}
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
                fullWidth
              />
            )}
          </Box>
        </Box>

        {/* SUBHEADER */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            {selectedBuilding ?
              t("storageList.showingFor", { name: renderBuildingLabel(selectedBuilding) }) :
              t("storageList.chooseBuilding")}
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
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
              sx={{ width: 260 }}
            />

            <IconButton size="small" disabled>
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/*  ADD STORAGE BUTTON */}
        {(selectedBuilding?.buildingCode === "BLD002" ||
          selectedBuilding?.buildingCode === "BLD003") && (
            <Box width="100%" mb={1} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setOpenCreate(true)}
                sx={{
                  px: 1.5,
                  py: 0.3,
                  fontSize: 12,
                  borderRadius: 1.2,
                  width: "fit-content",
                }}
              >
                + {t("storageList.addStorage")}
              </Button>
            </Box>
          )}

        {/* TABS */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1.5 }}
        >
          {STORAGE_TABS.map((t) => (
            <Tab key={t.key} label={t.label} />
          ))}
        </Tabs>

        {/* STORAGE LIST */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 1,
            pb: 1,
            scrollbarWidth: "thin",
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
                    borderColor:
                      selectedStorage?.storageCode === v.storageCode ? "#3CBD96" : "#e0e0e0",
                    cursor: "pointer",
                    transition: "0.18s",
                    "&:hover": { borderColor: "#3CBD96", bgcolor: "#f9fbff" },
                  }}
                >
                  {/* HEADER */}
                  <Box display="flex" alignItems="center" mb={1}>
                    <WarehouseIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography fontWeight={600} fontSize={13} sx={{ ml: 0.8, flex: 1 }} noWrap>
                      {v.storageCode}
                    </Typography>

                    <Chip
                      label={
                        translateStatus(t as any, v.status) ??
                        v.status ??
                        t("storageList.unknownStatus")
                      }
                      size="small"
                      sx={{
                        color:
                          colorMap[canonicalStatusKey(v.status) ?? "ready"] ?? "text.primary",
                        borderColor:
                          colorMap[canonicalStatusKey(v.status) ?? "ready"] ?? "#e0e0e0",
                        borderWidth: 1.3,
                        borderStyle: "solid",
                        fontSize: 12,
                        fontWeight: 500,
                        background: "transparent",
                        height: 22,
                      }}
                    />
                  </Box>

                  {/* INFO */}
                  <Typography fontSize={13} color="text.secondary" noWrap>
                    {t("storageList.type")}:{" "}
                    {translateStorageTypeName(t as any, v.storageTypeName) ??
                      t("storageList.na")}
                  </Typography>

                  <Typography fontSize={13} color="text.secondary" noWrap>
                    {t("storageList.dimensions")}: {v.width ?? "-"} x {v.length ?? "-"} x{" "}
                    {v.height ?? "-"}
                  </Typography>

                  {/* FOOTER */}
                  <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1}>
                    <RoomOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }} />
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

      {/* DIALOG TẠO STORAGE */}
      <CreateStorageDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        buildingId={selectedBuilding?.buildingId ?? 0}
        buildingCode={selectedBuilding?.buildingCode ?? ""}
        onCreated={async () => {
          if (!selectedBuilding) return;
          const resp = await getStorages({
            page: 1,
            pageSize: 1000,
            buildingCode: selectedBuilding.buildingCode,
          });
          setStorages(resp.data ?? []);
        }}
      />
    </Card>
  );
}
