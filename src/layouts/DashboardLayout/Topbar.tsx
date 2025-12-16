import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Avatar,
  Typography,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "@/features/ui/uiSlice";
import { getEmployeeRoles } from "@/api/employeeRoleApi";
import authApi, { clearAuthStorage, getRefreshToken } from "@/api/auth";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";


const cleanWhitespace = (s?: string | null) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ");

const toSnake = (s?: string | null) => cleanWhitespace(s).replace(/\s+/g, "_");
const normalize = (s?: string | null) => cleanWhitespace(s);

const buildNormalizedMap = (raw: Record<string, string>) => {
  const spacedMap: Record<string, string> = {};
  const snakeMap: Record<string, string> = {};
  for (const k of Object.keys(raw)) {
    const spaced = cleanWhitespace(k);
    const snake = spaced.replace(/\s+/g, "_");
    spacedMap[spaced] = raw[k];
    snakeMap[snake] = raw[k];
  }
  return { spacedMap, snakeMap };
};

const roleKeyMapRaw: Record<string, string> = {
  manager: "manager",
  "warehouse staff": "warehouse_staff",
  "delivery staff": "delivery_staff",
  admin: "admin",
  warehouse: "warehouse_staff",
  "nhân viên kho": "warehouse_staff",
  "giao hàng": "delivery_staff",
  "quản lý": "manager",
};

const roleMaps = buildNormalizedMap(roleKeyMapRaw);

export const canonicalRoleKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (roleMaps.spacedMap[spaced]) return roleMaps.spacedMap[spaced];
  if (roleMaps.snakeMap[snake]) return roleMaps.snakeMap[snake];
  return snake;
};

const groupNoData = (t: TFunction, groupKey: string) => {
  const looked = t(`${groupKey}.noData`);
  return looked !== `${groupKey}.noData` ? looked : "-";
};

export const translateRoleName = (t: TFunction, raw?: string | null, alt?: string | null) => {
  const key = canonicalRoleKey(raw ?? alt);
  const noData = groupNoData(t, "roleNames");
  if (!key) return noData;
  const looked = t(`roleNames.${key}`);
  if (looked !== `roleNames.${key}`) return looked;
  return raw ?? alt ?? key ?? noData;
};


function parseJwt(token?: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getInitials(name?: string | null) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


export default function Topbar() {
  const { t } = useTranslation("topbar");
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rolesMap, setRolesMap] = useState<Record<number, string>>({});
  const [user, setUser] = useState<{ name?: string; username?: string; role?: string } | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getEmployeeRoles({ pageSize: 1000 });
        const arr = resp?.data ?? [];
        if (!mounted) return;
        const map: Record<number, string> = {};
        arr.forEach((r) => {
          if (r?.employeeRoleId != null) map[Number(r.employeeRoleId)] = r.roleName;
        });
        setRolesMap(map);
      } catch (err) {
        console.warn("Failed to load roles", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshUserFromToken = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const payload = parseJwt(token);

      if (!payload) {
        setUser(null);
        return;
      }

      const name = payload.Name ?? payload.name ?? payload.fullName ?? payload.UserName ?? null;
      const username = payload.UserName ?? payload.username ?? null;

      let roleName: string | undefined;

      const rawRoleFromToken =
        payload.EmployeeRoleName ?? payload.Role ?? payload.role ?? null;

      const roleId =
        payload.EmployeeRoleId ?? payload.employeeRoleId ?? payload.RoleId ?? null;



      if (roleId != null && rolesMap[Number(roleId)]) {
        const raw = rolesMap[Number(roleId)];
        roleName = translateRoleName(t, raw, raw);
      } else {
        roleName = translateRoleName(t, rawRoleFromToken, rawRoleFromToken);
      }

      if (!roleName || roleName.trim() === "") {
        roleName =
          rawRoleFromToken ??
          (roleId != null ? String(roleId) : t("roleNames.noData"));
      }

      setUser({ name, username, role: roleName });
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUserFromToken();
  }, [rolesMap, t]);

  useEffect(() => {
    const handler = (ev: StorageEvent) => {
      if (ev.key === "accessToken" || ev.key === null) {
        refreshUserFromToken();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);


  const displayName = useMemo(() => {
    if (!user) return t("userDefault");
    return user.name ?? user.username ?? t("userDefault");
  }, [user, t]);

  const displayRole = useMemo(() => (user?.role ? String(user.role) : ""), [user]);

  const initials = getInitials(user?.name ?? user?.username ?? "");


  const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken() ?? localStorage.getItem("refreshToken");
      if (refreshToken) await authApi.logout({ refreshToken }).catch(() => {});
    } finally {
      clearAuthStorage();
      handleMenuClose();
      window.location.href = "/login";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: { xs: 1, sm: 1.5 },
        borderBottom: "1px solid #e5e7eb",
        bgcolor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* LEFT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isMobile && (
          <IconButton onClick={() => dispatch(toggleSidebar())}>
            <MenuRoundedIcon />
          </IconButton>
        )}
        <Box
          component="img"
          src="https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190185/LOGO-remove_1_o1wgk2.png"
          alt={t("logoAlt")}
          sx={{ height: { xs: 32, sm: 40 }, cursor: "pointer" }}
          onClick={() => (window.location.href = "/")}
        />
      </Box>

      {/* RIGHT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

        {/* USER AVATAR */}
        {isMobile ? (
          <Avatar sx={{ cursor: "pointer" }} onClick={handleAvatarClick}>
            {initials || <AccountCircleIcon />}
          </Avatar>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "#e6f7f2", color: "#075", cursor: "pointer" }} onClick={handleAvatarClick}>
              {initials || <AccountCircleIcon />}
            </Avatar>
            <Box>
              <Typography fontWeight={600} noWrap>{displayName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{displayRole}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* MENU */}
      <Menu
        id="topbar-avatar-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        PaperProps={{ elevation: 3, sx: { mt: "6px", minWidth: 140 } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          {t("profile")}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          {t("logout")}
        </MenuItem>
      </Menu>
    </Box>
  );
}
