import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from "@mui/material";

export default function AvailableCargo() {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1, bgcolor: "#fff" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography fontWeight={600}>Available Cargo</Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
            View All
          </Typography>
        </Box>

        <Typography fontSize={13} mb={1}>
          SHIPID03 – Mumbai → Delhi
        </Typography>
        <LinearProgress
          variant="determinate"
          value={40}
          sx={{
            height: 8,
            borderRadius: 5,
            mb: 1,
          }}
        />
        <Typography fontSize={13} color="text.secondary">
          40% loaded
        </Typography>
      </CardContent>
    </Card>
  );
}
