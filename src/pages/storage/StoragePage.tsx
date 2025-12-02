// src/pages/storage/StoragePage.tsx
import { Box } from "@mui/material";
import StorageList from "./widgets/StorageList";
import TruckLoadCard from "./widgets/TruckLoadCard";
import OrderPanel from "./widgets/OrderPanel";
import { useState } from "react";
import type { StorageRespItem } from "@/api/storageApi";

export default function StoragePage() {
  const [activeStorage, setActiveStorage] = useState<StorageRespItem | null>(null);

  return (
    <Box
      sx={{
        // Grid responsive:
        // xs: 1 column
        // sm/md: 2 columns (list + main)
        // lg+: 3 columns
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr", // mobile: stack vertically
          sm: "1fr 1.4fr", // small/tablet: two columns
          lg: "1.4fr 2fr 1.3fr", // large: three columns (original proportions)
        },
        gap: { xs: 1.5, sm: 2 },
        // Dùng minHeight thay vì calc cứng, nhưng vẫn giữ chiều cao gần full viewport
        minHeight: { xs: "calc(100vh - 88px)", sm: "calc(100vh - 90px)" },
        height: { md: "auto" },
        // Khi grid là 1 cột, muốn các panel có khoảng padding bên ngoài
        px: { xs: 1, sm: 2 },
        // Để mỗi panel cuộn độc lập (giữ header cố định ở trong widget nếu widget có header)
        "& > *": {
          // mỗi ô sẽ cao tối đa làm đầy vùng, và nội dung bên trong có thể overflow
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // quan trọng để overflow cho children hoạt động trong flex container
          overflow: "hidden",
        },
      }}
    >
      {/* StorageList: đặt overflow auto để nội dung list scroll được */}
      <Box
        sx={{
          // trên mobile muốn panel có margin-bottom để trông thoáng
          pb: { xs: 1, sm: 0 },
          height: "100%",
          minHeight: 0,
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <StorageList onSelectStorage={(s) => setActiveStorage(s)} selectedStorage={activeStorage} />
        </Box>
      </Box>

      {/* TruckLoadCard */}
      <Box sx={{ height: "100%", minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <TruckLoadCard storage={activeStorage} />
        </Box>
      </Box>

      {/* OrderPanel */}
      <Box sx={{ height: "100%", minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <OrderPanel />
        </Box>
      </Box>
    </Box>
  );
}
