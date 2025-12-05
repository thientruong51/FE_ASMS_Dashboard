import { Box } from "@mui/material";
import RecentOrders from "./widgets/RecentOrders";
import LoadingTrucks from "./widgets/LoadingTrucks";
import OrderRequests from "./widgets/OrderRequests";
import LatestShipping from "./widgets/LatestShipping";
import RevenueCard from "./widgets/RevenueCard"; 

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
            "revenue"
            "trucks"
            "requests"
            "shipping"
            "unloading"
            "available"
          `,
          lg: `
            "orders revenue trucks"
            "shipping shipping requests"
            "unloading available requests"
          `,
        },
      }}
    >
      <Box sx={{ gridArea: "orders" }}>
        <RecentOrders />
      </Box>

      <Box sx={{ gridArea: "revenue" }}>
        <RevenueCard />
      </Box>

      <Box sx={{ gridArea: "trucks" }}>
        <LoadingTrucks />
      </Box>

      <Box sx={{ gridArea: "shipping" }}>
        <LatestShipping />
      </Box>

      <Box sx={{ gridArea: "requests" }}>
        <OrderRequests />
      </Box>
    </Box>
  );
}
