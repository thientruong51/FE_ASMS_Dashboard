import React, { useMemo } from "react";
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
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AnnouncementIcon from '@mui/icons-material/Announcement';

import { getAuthClaimsFromStorage } from "@/utils/auth";

type Item = {
  label: string;
  icon: React.ReactNode;
  to: string;
  allowedRoles: number[]; 
};

export default function Sidebar() {
  const { t } = useTranslation("sidebar");
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const claims = getAuthClaimsFromStorage();
  const roleId = claims && claims.EmployeeRoleId !== undefined && claims.EmployeeRoleId !== null
    ? Number(claims.EmployeeRoleId)
    : null;


  const ALL = [1, 2, 3, 4];

  const items: Item[] = [
    { label: t("dashboard"), icon: <DashboardIcon />, to: "/", allowedRoles: ALL },
    { label: t("orders"), icon: <AssignmentIcon />, to: "/orders", allowedRoles: ALL },
    { label: t("trackingHistorys"), icon: <AssignmentAddIcon />, to: "/trackingHistorys", allowedRoles: ALL },
    { label: t("contacts"), icon: <ContactPhoneIcon />, to: "/contacts", allowedRoles: ALL },
    { label: t("storages"), icon: <InventoryIcon />, to: "/storages", allowedRoles: ALL },
    { label: t("customers"), icon: <PeopleIcon />, to: "/customers", allowedRoles: [1,4] }, // spec: role1 and role4
    { label: t("paymentHistorys"), icon: <RequestQuoteIcon />, to: "/paymentHistorys", allowedRoles: [1,4] },
    { label: t("employeeRoles"), icon: <ManageAccountsIcon />, to: "/employee-roles", allowedRoles: [4] },
    { label: t("staffs"), icon: <EngineeringIcon />, to: "/staffs", allowedRoles: [1,4] },
    { label: t("services"), icon: <BallotIcon />, to: "/services", allowedRoles: [1,4] },
    { label: t("buildings"), icon: <ApartmentIcon />, to: "/buildings", allowedRoles: [4] },
    { label: t("storageTypes"), icon: <WarehouseIcon />, to: "/storage-types", allowedRoles: [4] },
    { label: t("shelfsTypes"), icon: <ShelvesIcon />, to: "/shelfs", allowedRoles: [1,4] },
    { label: t("containerTypes"), icon: <WidgetsIcon />, to: "/container-types", allowedRoles: [4] },
    { label: t("productTypes"), icon: <LiquorIcon />, to: "/product-types", allowedRoles: [4] },
    { label: t("prices"), icon: <PriceChangeIcon />, to: "/prices", allowedRoles: [1,4] },
    { label: t("businessRules"), icon: <AnnouncementIcon />, to: "/businessRules", allowedRoles: [1,4] },
    { label: t("settings"), icon: <SettingsIcon />, to: "/settings", allowedRoles: ALL },
  ];

  const canAccess = (allowedRoles: number[]) => {
    if (!roleId) return false; 
    if (roleId === 4) return true;
    return allowedRoles.includes(roleId);
  };

  const visibleItems = useMemo(() => items.filter((it) => canAccess(it.allowedRoles)), [roleId]);

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
        height: "110%",
      }}
    >
      {visibleItems.map((item) => {
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
        sx={{
          zIndex: 2000,
          "& .MuiDrawer-paper": {
            width: 70,
            boxSizing: "border-box",
            bgcolor: "#fff",
            borderRight: "1px solid #e5e7eb",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100%",
          },
        }}
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
