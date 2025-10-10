import { Box } from "@mui/material";
import VehicleList from "./widgets/StorageList";
import TruckLoadCard from "./widgets/TruckLoadCard";
import OrderPanel from "./widgets/OrderPanel";

export default function StoragePage() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.4fr 2fr 1.3fr" },
        gap: 2,
        height: "100%",
      }}
    >
      <VehicleList />
      <TruckLoadCard />
      <OrderPanel />
    </Box>
  );
}
