import {
  Box,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import type { RootState } from "@/app/store";
import { setSidebar } from "@/features/ui/uiSlice";
import { useTranslation } from "react-i18next";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import ShelvesIcon from '@mui/icons-material/Shelves';
import EngineeringIcon from "@mui/icons-material/Engineering";
import WidgetsIcon from "@mui/icons-material/Widgets";
import ApartmentIcon from '@mui/icons-material/Apartment';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BallotIcon from '@mui/icons-material/Ballot';
import LiquorIcon from '@mui/icons-material/Liquor';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

export default function Sidebar() {
  const { t } = useTranslation("sidebar");
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const items = [
    { label: t("dashboard"), icon: <DashboardIcon />, to: "/" },
    { label: t("orders"), icon: <AssignmentIcon />, to: "/orders" },
    { label: t("trackingHistorys"), icon: <AssignmentAddIcon />, to: "/trackingHistorys" },
    { label: t("storages"), icon: <InventoryIcon />, to: "/storages" },
    { label: t("customers"), icon: <PeopleIcon />, to: "/customers" },
    { label: t("paymentHistorys"), icon: <RequestQuoteIcon />, to: "/paymentHistorys" },
    { label: t("employeeRoles"), icon: <ManageAccountsIcon />, to: "/employee-roles" },
    { label: t("staffs"), icon: <EngineeringIcon />, to: "/staffs" },
    { label: t("services"), icon: <BallotIcon />, to: "/services" },
    { label: t("buildings"), icon: <ApartmentIcon />, to: "/buildings" },
    { label: t("storageTypes"), icon: <WarehouseIcon />, to: "/storage-types" },
    { label: t("shelfsTypes"), icon: <ShelvesIcon />, to: "/shelfs" },
    { label: t("containerTypes"), icon: <WidgetsIcon />, to: "/container-types" },
    { label: t("productTypes"), icon: <LiquorIcon />, to: "/product-types" },
    { label: t("settings"), icon: <SettingsIcon />, to: "/settings" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) dispatch(setSidebar(false));
  };

  const sidebarContent = (
    <Box
      sx={{
        width: 70,
        bgcolor: "#fff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 2,
        gap: 1.5,
        height: "100%",
      }}
    >
      {items.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Tooltip key={item.to} title={item.label} placement="right">
            <IconButton
              onClick={() => handleNavigate(item.to)}
              sx={{
                color: active ? "primary.main" : "text.secondary",
                bgcolor: active ? "rgba(33,150,243,0.12)" : "transparent",
                borderRadius: "12px",
                transition: "0.25s",
                "&:hover": { bgcolor: "rgba(33,150,243,0.1)" },
              }}
            >
              {item.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => dispatch(setSidebar(false))}
        ModalProps={{ keepMounted: true }}
        sx={{ zIndex: 2000, "& .MuiDrawer-paper": { width: 70, boxSizing: "border-box", bgcolor: "#fff", borderRight: "1px solid #e5e7eb", position: "fixed", top: 0, left: 0, height: "100%" } }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: 70, bgcolor: "#fff", borderRight: "1px solid #e5e7eb", position: "sticky", top: 0, height: "100vh", zIndex: 100 }}>
      {sidebarContent}
    </Box>
  );
}
