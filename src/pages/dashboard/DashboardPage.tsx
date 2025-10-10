import { Box } from "@mui/material";
import RecentOrders from "./widgets/RecentOrders";
import LoadingTrucks from "./widgets/LoadingTrucks";
import OrderRequests from "./widgets/OrderRequests";
import LatestShipping from "./widgets/LatestShipping";
import UnloadingCargo from "./widgets/UnloadingCargo";
import AvailableCargo from "./widgets/AvailableCargo";

export default function DashboardPage() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          lg: "2fr 1.2fr 1.2fr",
        },
        gridTemplateAreas: {
          xs: `
            "orders"
            "trucks"
            "requests"
            "shipping"
            "unloading"
            "available"
          `,
          lg: `
            "orders trucks requests"
            "shipping shipping requests"
            "unloading available requests"
          `,
        },
      }}
    >
      <Box sx={{ gridArea: "orders" }}>
        <RecentOrders />
      </Box>

      <Box sx={{ gridArea: "trucks" }}>
        <LoadingTrucks />
      </Box>

      <Box sx={{ gridArea: "requests" }}>
        <OrderRequests />
      </Box>

      <Box sx={{ gridArea: "shipping" }}>
        <LatestShipping />
      </Box>

      <Box sx={{ gridArea: "unloading" }}>
        <UnloadingCargo />
      </Box>

      <Box sx={{ gridArea: "available" }}>
        <AvailableCargo />
      </Box>
    </Box>
  );
}
