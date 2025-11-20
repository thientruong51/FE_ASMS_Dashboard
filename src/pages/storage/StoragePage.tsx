// src/pages/storage/StoragePage.tsx
import { Box } from "@mui/material";
import StorageList from "./widgets/StorageList";
import TruckLoadCard from "./widgets/TruckLoadCard";
import OrderPanel from "./widgets/OrderPanel";
import  { useState } from "react";
import type { StorageRespItem } from "@/api/storageApi";

export default function StoragePage() {
  const [activeStorage, setActiveStorage] = useState<StorageRespItem | null>(null);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1.4fr 2fr 1.3fr" },
        gap: 2,
        height: "calc(100vh - 90px)",
        overflow: "hidden",
        gridAutoRows: "minmax(0, 1fr)",
        alignItems: "stretch",
      }}
    >
      <StorageList onSelectStorage={(s) => setActiveStorage(s)} selectedStorage={activeStorage} />

      <TruckLoadCard storage={activeStorage} />

      <OrderPanel />
    </Box>
  );
}
