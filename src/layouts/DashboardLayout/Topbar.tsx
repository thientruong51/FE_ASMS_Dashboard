import  { useEffect, useMemo, useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "@/features/ui/uiSlice";
import { getEmployeeRoles } from "@/api/employeeRoleApi";

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

        {!isMobile && (
          <TextField
            placeholder="Search by User id, User Name, Date etc"
            size="small"
            sx={{
              maxWidth: 320,
              width: "100%",
              backgroundColor: "#f8f9fb",
              borderRadius: 1,
              flexShrink: 1,
              minWidth: 0,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <IconButton color="primary">
          <AddIcon />
        </IconButton>

        <IconButton>
          <NotificationsNoneIcon />
        </IconButton>

        {isMobile ? (
          <Avatar sx={{ bgcolor: "#f1f1f1" }}>
            {initials ? <Typography variant="body2">{initials}</Typography> : <AccountCircleIcon color="action" />}
          </Avatar>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Avatar sx={{ bgcolor: "#e6f7f2", color: "#075" }}>
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
    </Box>
  );
}
