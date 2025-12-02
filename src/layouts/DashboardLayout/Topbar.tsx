import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
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
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "@/features/ui/uiSlice";
import { getEmployeeRoles } from "@/api/employeeRoleApi";
import authApi, { clearAuthStorage, getRefreshToken } from "@/api/auth";

function parseJwt(token?: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
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
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rolesMap, setRolesMap] = useState<Record<number, string>>({});
  const [user, setUser] = useState<{ name?: string; username?: string; role?: string } | null>(null);

  // Menu state for avatar
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getEmployeeRoles({ pageSize: 1000 });
        const arr = resp?.data ?? [];
        if (!mounted) return;
        const m: Record<number, string> = {};
        arr.forEach((r) => {
          if (r?.employeeRoleId != null) m[Number(r.employeeRoleId)] = r.name;
        });
        setRolesMap(m);
      } catch (err) {
        console.warn("Failed to load employee roles", err);
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
      const roleId = payload.EmployeeRoleId ?? payload.employeeRoleId ?? payload.RoleId ?? null;
      if (roleId != null) {
        const idNum = Number(roleId);
        if (!Number.isNaN(idNum) && rolesMap && rolesMap[idNum]) {
          roleName = rolesMap[idNum];
        } else if (payload.EmployeeRoleName || payload.Role || payload.role) {
          roleName = payload.EmployeeRoleName ?? payload.Role ?? payload.role;
        } else {
          roleName = String(roleId);
        }
      } else {
        roleName = payload.EmployeeRoleName ?? payload.Role ?? payload.role ?? undefined;
      }

      setUser({ name, username, role: roleName });
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUserFromToken();

    const handler = (ev: StorageEvent) => {
      if (ev.key === "accessToken" || ev.key === null) {
        refreshUserFromToken();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [rolesMap]);

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.name ?? user.username ?? "User";
  }, [user]);

  const displayRole = useMemo(() => {
    if (!user || !user.role) return "";
    return String(user.role);
  }, [user]);

  const initials = getInitials(user?.name ?? user?.username ?? "");

  // handlers for avatar menu
  const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken() ?? localStorage.getItem("refreshToken");
      if (refreshToken) {
        // try to notify server (best-effort)
        await authApi.logout({ refreshToken }).catch(() => {
          // ignore server error, we still clear local storage
        });
      }
    } catch (err) {
      // ignore
    } finally {
      clearAuthStorage();
      handleMenuClose();
      // navigate to login page (adjust path if your app uses different route)
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {isMobile && (
          <IconButton onClick={() => dispatch(toggleSidebar())}>
            <MenuRoundedIcon />
          </IconButton>
        )}

        {/* <-- Logo replaces the search */}
        <Box
          component="img"
          src="https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190185/LOGO-remove_1_o1wgk2.png"
          alt="Logo"
          sx={{
            height: { xs: 32, sm: 40 },
            cursor: "pointer",
            userSelect: "none",
            display: "block",
          }}
          onClick={() => {
            // navigate to home (adjust if you use react-router)
            window.location.href = "/";
          }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <IconButton color="primary">
          <AddIcon />
        </IconButton>

        <IconButton>
          <NotificationsNoneIcon />
        </IconButton>

        {isMobile ? (
          <Avatar
            sx={{ bgcolor: "#f1f1f1", cursor: "pointer" }}
            onClick={handleAvatarClick}
            aria-controls={menuOpen ? "topbar-avatar-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
          >
            {initials ? <Typography variant="body2">{initials}</Typography> : <AccountCircleIcon color="action" />}
          </Avatar>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Avatar
              sx={{ bgcolor: "#e6f7f2", color: "#075", cursor: "pointer" }}
              onClick={handleAvatarClick}
              aria-controls={menuOpen ? "topbar-avatar-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? "true" : undefined}
            >
              {initials ? <Typography variant="body2">{initials}</Typography> : <AccountCircleIcon color="action" />}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {displayRole}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Menu
        id="topbar-avatar-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: "6px",
            minWidth: 100,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
       
        <Divider />
        

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
