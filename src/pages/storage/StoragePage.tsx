import { Box } from "@mui/material";
import StorageList from "./widgets/StorageList";
import TruckLoadCard from "./widgets/TruckLoadCard";
import OrderPanel from "./widgets/OrderPanel";
import { useState } from "react";
import type { StorageRespItem } from "@/api/storageApi";

import { useTranslation } from "react-i18next";

export default function StoragePage() {
  const { t } = useTranslation("storagePage");
  const [activeStorage, setActiveStorage] = useState<StorageRespItem | null>(null);

  return (
    <Box
      sx={{

        display: "grid",
        gridTemplateColumns: {
          xs: "1fr", 
          sm: "1fr 1.4fr", 
          lg: "1.4fr 2fr 1.3fr", 
        },
        gap: { xs: 1.5, sm: 2 },
        minHeight: { xs: "calc(100vh - 88px)", sm: "calc(100vh - 90px)" },
        height: {sm: "calc(100vh - 90px)" },
        px: { xs: 1, sm: 2 },
        "& > *": {
          display: "flex",
          flexDirection: "column",
          minHeight: 0, 
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          pb: { xs: 1, sm: 0 },
          height: "100%",
          minHeight: 0,
        }}
        aria-label={t("page.panels.storageListAria")}
        data-testid="panel-storage-list"
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <StorageList onSelectStorage={(s) => setActiveStorage(s)} selectedStorage={activeStorage} />
        </Box>
      </Box>

      {/* TruckLoadCard */}
      <Box
        sx={{ height: "100%", minHeight: 0 }}
        aria-label={t("page.panels.truckLoadAria")}
        data-testid="panel-truck-load"
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <TruckLoadCard storage={activeStorage} />
        </Box>
      </Box>

      {/* OrderPanel */}
      <Box
        sx={{ height: "100%", minHeight: 0 }}
        aria-label={t("page.panels.orderPanelAria")}
        data-testid="panel-order-panel"
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <OrderPanel />
        </Box>
      </Box>
    </Box>
  );
}
