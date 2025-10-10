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

export default function Topbar() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isMobile && (
          <IconButton onClick={() =>  dispatch(toggleSidebar())}>
            <MenuRoundedIcon />
          </IconButton>
        )}

        {!isMobile && (
          <TextField
            placeholder="Search by User id, User Name, Date etc"
            size="small"
            sx={{
              width: 300,
              backgroundColor: "#f8f9fb",
              borderRadius: 1,
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton color="primary">
          <AddIcon />
        </IconButton>
        <IconButton>
          <NotificationsNoneIcon />
        </IconButton>

        {isMobile ? (
          <Avatar sx={{ bgcolor: "#f1f1f1" }}>
            <AccountCircleIcon color="action" />
          </Avatar>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "#f1f1f1" }}>
              <AccountCircleIcon color="action" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Harsh Vani
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Deportation Manager
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
