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
  useTheme,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MapImg from "@/assets/react.svg"; 

import { useState } from "react";

const storages = [
  {
    id: "STORAGE03",
    status: "Arriving",
    route: "Route A002",
    stages: [
      { label: "Arriving", time: "17 July 2024, 18:00" },
      { label: "Unloading", time: "17 July 2024, 19:00" },
      { label: "Loading", time: "19 July 2024, 10:00" },
      { label: "Preparing", time: "19 July 2024, 01:00" },
    ],
  },
  {
    id: "STORAGE03",
    status: "Loading",
    route: "Route A002",
    stages: [
      { label: "Arriving", time: "17 July 2024, 18:00" },
      { label: "Unloading", time: "17 July 2024, 19:00" },
      { label: "Loading", time: "19 July 2024, 10:00" },
      { label: "Preparing", time: "19 July 2024, 01:00" },
    ],
  },
  {
    id: "STORAGE03",
    status: "Available",
    route: "Route A002",
    stages: [
      { label: "Arriving", time: "17 July 2024, 18:00" },
      { label: "Unloading", time: "17 July 2024, 19:00" },
      { label: "Loading", time: "19 July 2024, 10:00" },
      { label: "Preparing", time: "19 July 2024, 01:00" },
    ],
  },
  {
    id: "STORAGE03",
    status: "Unloading",
    route: "Route A002",
    stages: [
      { label: "Arriving", time: "17 July 2024, 18:00" },
      { label: "Unloading", time: "17 July 2024, 19:00" },
      { label: "Loading", time: "19 July 2024, 10:00" },
      { label: "Preparing", time: "19 July 2024, 01:00" },
    ],
  },
  {
    id: "STORAGE03",
    status: "Departed",
    route: "Route A002",
    stages: [
      { label: "Arriving", time: "17 July 2024, 18:00" },
      { label: "Unloading", time: "17 July 2024, 19:00" },
      { label: "Loading", time: "19 July 2024, 10:00" },
      { label: "Preparing", time: "19 July 2024, 01:00" },
    ],
  },
];

const colorMap: Record<string, string> = {
  Arriving: "#fbc02d",
  Loading: "#1976d2",
  Unloading: "#2e7d32",
  Available: "#0288d1",
  Departed: "#757575",
};

export default function VehicleList() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* HEADER */}
        <Typography fontWeight={600} fontSize={15} mb={1}>
          storages
        </Typography>

        {/* SEARCH BAR */}
        <TextField
          placeholder="Search by Shipment ID, No."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1.5,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {/* FILTER TABS */}
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
          {["Active", "Loading", "Unloading", "Arriving", "Preparing"].map(
            (label, i) => (
              <Tab key={i} label={label} />
            )
          )}
        </Tabs>

        {/* VEHICLE CARDS */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          {storages.map((v, i) => (
            <Card
              key={i}
              variant="outlined"
              sx={{
                borderRadius: 2,
                p: 1.5,
                borderColor: "#e0e0e0",
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { borderColor: "#90caf9", bgcolor: "#f9fbff" },
              }}
            >
              {/* Header */}
              <Box display="flex" alignItems="center" mb={1}>
                <LocalShippingIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography
                  fontWeight={600}
                  fontSize={14}
                  sx={{ ml: 1, flex: 1 }}
                >
                  {v.id}
                </Typography>
                <Chip
                  label={v.status}
                  size="small"
                  sx={{
                    color: colorMap[v.status],
                    borderColor: colorMap[v.status],
                    borderWidth: 1.3,
                    borderStyle: "solid",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "transparent",
                    height: 22,
                  }}
                />
              </Box>

              {/* Timeline + Map */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                {/* Timeline */}
                <Box sx={{ flex: 1 }}>
                  {v.stages.map((s, j) => (
                    <Box
                      key={j}
                      display="flex"
                      alignItems="center"
                      mb={0.3}
                    >
                      <FiberManualRecordIcon
                        sx={{ fontSize: 8, color: "#64b5f6", mr: 1 }}
                      />
                      <Typography fontSize={13} color="text.secondary">
                        {s.label}
                      </Typography>
                      <Typography
                        fontSize={13}
                        color="text.secondary"
                        sx={{ ml: "auto" }}
                      >
                        {s.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Map thumbnail */}
                <Box
                  component="img"
                  src={MapImg}
                  alt="map"
                  sx={{
                    width: 80,
                    height: 60,
                    borderRadius: 1.5,
                    border: "1px solid #e0e0e0",
                    objectFit: "cover",
                  }}
                />
              </Box>

              {/* Footer route */}
              <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1}>
                <RoomOutlinedIcon
                  sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }}
                />
                <Typography fontSize={13} color="text.secondary">
                  {v.route}
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
