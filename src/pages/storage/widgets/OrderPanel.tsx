import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";

export default function OrderPanel() {
  const theme = useTheme();

  const orders = Array.from({ length: 16 }).map((_, i) => ({
    id: "ORDERID0123",
    weight: "88.9 kg",
    route: "ROUTEAA001",
    color: i % 2 === 0 ? "#e3f2fd" : "#ede7f6", 
  }));

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.2}
        >
          <Typography fontWeight={600} fontSize={15}>
            Orders
          </Typography>
        </Box>

        {/* SEARCH */}
        <TextField
          placeholder="Search by Order ID, No."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1.5,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {/* SUBHEADER */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography fontSize={13} fontWeight={600} color="text.secondary">
            Recommendation
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
            <IconButton size="small">
              <ViewListOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <MapOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ViewModuleOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* ORDER LIST */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            overflowY: "auto",
            pr: 0.5,
            flex: 1,
          }}
        >
          {orders.map((o, i) => (
            <Box
              key={i}
              sx={{
                width: "calc(50% - 4px)",
              }}
            >
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  backgroundColor: o.color,
                  p: 1.3,
                  cursor: "pointer",
                  transition: "0.2s",
                  "&:hover": {
                    borderColor: theme.palette.primary.light,
                    bgcolor: "#f9fbff",
                  },
                }}
              >
                <Box display="flex" justifyContent="flex-end" mb={0.3}>
                  <DragIndicatorOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: "text.secondary",
                      opacity: 0.6,
                    }}
                  />
                </Box>

                <Typography
                  fontWeight={600}
                  fontSize={13}
                  mb={0.4}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <LockOutlinedIcon
                    sx={{ fontSize: 15, color: "text.secondary" }}
                  />
                  ID: {o.id}
                </Typography>

                <Typography fontSize={13} color="text.secondary">
                  {o.weight}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  {o.route}
                </Typography>
              </Card>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
