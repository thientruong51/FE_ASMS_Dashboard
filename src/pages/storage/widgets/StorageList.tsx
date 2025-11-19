// src/pages/storage/widgets/StorageList.tsx
import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { getBuildings } from "@/api/buildingApi";
import { getStorages, type StorageRespItem } from "@/api/storageApi";
import type { Building } from "@/pages/building/components/types";

type Props = {
  onSelectStorage?: (s: StorageRespItem) => void;
  selectedStorage?: StorageRespItem | null;
};

export default function StorageList({ onSelectStorage, selectedStorage }: Props) {
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
        setBuildingsError(err?.message ?? "Failed to load buildings");
      } finally {
        if (mounted) setLoadingBuildings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        setStoragesError(err?.message ?? "Failed to load storages");
      } finally {
        if (mounted) setLoadingStorages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedBuilding]);

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
    Arriving: "#fbc02d",
    Loading: "#1976d2",
    Unloading: "#2e7d32",
    Available: "#0288d1",
    Departed: "#757575",
    Ready: "#2e7d32",
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        overflow: "hidden",
        height: { xs: "80vh", sm: "100%" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 2.5, pb: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* HEADER */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
          <Typography fontWeight={600} fontSize={15}>
            Storages
          </Typography>

          <Box sx={{ width: 320 }}>
            {loadingBuildings ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography fontSize={13}>Loading buildings...</Typography>
              </Box>
            ) : buildingsError ? (
              <Typography fontSize={13} color="error">
                {buildingsError}
              </Typography>
            ) : (
              <Autocomplete
                options={buildings}
                getOptionLabel={(opt) =>
                  opt ? `${opt.name ?? opt.buildingCode ?? "Building"} (${opt.buildingCode ?? opt.buildingId ?? ""})` : ""
                }
                value={selectedBuilding}
                onChange={(_, v) => setSelectedBuilding(v)}
                inputValue={buildingInputValue}
                onInputChange={(_, v) => setBuildingInputValue(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select building..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                clearOnEscape
              />
            )}
          </Box>
        </Box>

        {/* SUBHEADER */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            {selectedBuilding ? `Showing storages for ${selectedBuilding.name ?? selectedBuilding.buildingCode}` : "Choose a building to load storages"}
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
            <TextField
              size="small"
              placeholder="Search storages..."
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
              px: 1.8,
              borderRadius: "8px",
              mr: 1,
            },
            "& .Mui-selected": {
              bgcolor: "rgba(25,118,210,0.08)",
              color: "primary.main",
            },
          }}
        >
          {["All", "Loading", "Unloading", "Arriving", "Preparing"].map((label, i) => (
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
            maxHeight: { xs: "calc(80vh - 200px)", sm: "none" },
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": { background: "#c1c1c1", borderRadius: "8px" },
          }}
        >
          <Box display="flex" flexDirection="column" gap={1.5}>
            {loadingStorages ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography fontSize={13}>Loading storages...</Typography>
              </Box>
            ) : storagesError ? (
              <Typography color="error">{storagesError}</Typography>
            ) : !selectedBuilding ? (
              <Typography fontSize={13} color="text.secondary">
                Please select a building to view its storages.
              </Typography>
            ) : filteredStorages.length === 0 ? (
              <Typography fontSize={13} color="text.secondary">
                No storages found for this building / filters.
              </Typography>
            ) : (
              filteredStorages.map((v, i) => (
                <Card
                  key={v.storageCode ?? i}
                  variant="outlined"
                  onClick={() => onSelectStorage?.(v)}
                  sx={{
                    borderRadius: 2,
                    p: 1.5,
                    borderColor: (selectedStorage?.storageCode === v.storageCode) ? "#90caf9" : "#e0e0e0",
                    cursor: "pointer",
                    transition: "0.2s",
                    "&:hover": { borderColor: "#90caf9", bgcolor: "#f9fbff" },
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocalShippingIcon color="primary" sx={{ fontSize: 22 }} />
                    <Typography fontWeight={600} fontSize={14} sx={{ ml: 1, flex: 1 }}>
                      {v.storageCode}
                    </Typography>
                    <Chip
                      label={v.status}
                      size="small"
                      sx={{
                        color: colorMap[v.status ?? "Ready"] ?? "text.primary",
                        borderColor: colorMap[v.status ?? "Ready"] ?? "#e0e0e0",
                        borderWidth: 1.3,
                        borderStyle: "solid",
                        fontSize: 12,
                        fontWeight: 500,
                        background: "transparent",
                        height: 22,
                      }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" alignItems="center" mb={0.35}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: "#64b5f6", mr: 1 }} />
                        <Typography fontSize={13} color="text.secondary">
                          Type: {v.storageTypeName ?? "N/A"}
                        </Typography>
                        <Typography fontSize={13} color="text.secondary" sx={{ ml: "auto" }}>
                          Active: {v.isActive ? "Yes" : "No"}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" mb={0.35}>
                        <Typography fontSize={13} color="text.secondary">Dimensions:</Typography>
                        <Typography fontSize={13} color="text.secondary" sx={{ ml: 1 }}>
                          {v.width ?? "-"} x {v.length ?? "-"} x {v.height ?? "-"}
                        </Typography>
                      </Box>
                    </Box>

                   
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1}>
                    <RoomOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }} />
                    <Typography fontSize={13} color="text.secondary">
                      {selectedBuilding?.address ?? ""}
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
