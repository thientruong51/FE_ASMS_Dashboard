import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

export default function UnloadingCargo() {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: "#fff" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography fontWeight={600}>Unloading Cargo</Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
            View All
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          SHIPID03 • Mumbai → Delhi ETA 17 July 2024
        </Typography>
      </CardContent>
    </Card>
  );
}
