import { Box, } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: "#f9fafc",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <Sidebar />

      {/* Main column */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: 0,
        }}
      >
        <Topbar />

        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            p: { xs: 1.5, md: 3 },
            width: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
