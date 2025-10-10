import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setSidebar } from "@/features/ui/uiSlice";

export default function MobileNav() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={() => dispatch(setSidebar(false))}
      PaperProps={{
        sx: {
          width: 240,
          bgcolor: "background.paper",
          borderRight: "1px solid #e0e0e0",
          p: 1,
        },
      }}
    >
      <Box sx={{ mt: 1 }}>
        <List>
          <ListItemButton onClick={() => dispatch(setSidebar(false))}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
