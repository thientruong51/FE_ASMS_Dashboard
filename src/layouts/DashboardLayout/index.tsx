// src/layouts/DashboardLayout.tsx
import { Box, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTheme } from "@mui/material/styles";

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: "#f9fafc",
        // Prevent page-level horizontal scroll
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Sidebar: keep as-is (if your sidebar is fixed width ensure it doesn't use vw or percentages that push layout) */}
      <Sidebar />

      {/* Main column */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          // Important: allow this flex child to shrink (minWidth:0 allows children to shrink inside flex)
          minWidth: 0,
        }}
      >
        <Topbar />

        <Box
          component="main"
          sx={{
            flex: 1,
            // vertical scroll only for page content
            overflowY: "auto",
            // no horizontal scroll at page-level
            overflowX: "hidden",
            // ensure paddings don't cause overflow calculations issues
            boxSizing: "border-box",
            p: { xs: 1.5, md: 3 },
            // optionally constrain inner content width so very large children don't push outside
            width: "100%",
          }}
        >
          {/* Outlet pages must also respect minWidth:0 on containers when using flex */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
