import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TruckImg from "@/assets/react.svg"; 
import WeightBlock100 from "./WeightBlock100";
import WeightBlock200 from "./WeightBlock200";

export default function TruckLoadCard() {
  const loadPercent = 60;

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
      <CardContent sx={{ p: 3 }}>
        {/* HEADER: truck info */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography fontWeight={700} fontSize={16}>
              Eicher Pro 2059
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              DL04MP7045
            </Typography>
          </Box>
          <Box
            component="img"
            src={TruckImg}
            alt="Truck"
            sx={{
              width: "100%",
              maxWidth: 300,
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>

        {/* LOAD INFO */}
        <Box display="flex" gap={4} mt={2} mb={1}>
          <Box>
            <Typography fontSize={13} color="text.secondary">
              Load Volume
            </Typography>
            <Typography fontWeight={600}>372.45 in²</Typography>
          </Box>
          <Box>
            <Typography fontSize={13} color="text.secondary">
              Max Weight
            </Typography>
            <Typography fontWeight={600}>6.5 Tone</Typography>
          </Box>
        </Box>

        {/* PROGRESS */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={0.6} mb={0.3}>
            <Typography fontSize={13} fontWeight={600}>
              Load Management
            </Typography>
            <Tooltip title="Drag and drop the orders into available weight blocks">
              <InfoOutlinedIcon
                sx={{ fontSize: 16, color: "text.secondary" }}
              />
            </Tooltip>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <LinearProgress
              variant="determinate"
              value={loadPercent}
              sx={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                [`& .MuiLinearProgress-bar`]: {
                  background:
                    "linear-gradient(90deg,#1976d2,#42a5f5,#64b5f6,#bbdefb)",
                },
              }}
            />
            <Typography fontWeight={600}>{loadPercent}%</Typography>
          </Box>

          <Typography
            fontSize={13}
            fontWeight={500}
            mt={0.5}
            textAlign="right"
            color="text.secondary"
          >
            2.5 Ton Out of 6.5 Ton is Available
          </Typography>
        </Box>

        {/* HƯỚNG DẪN */}
        <Box
          sx={{
            bgcolor: "#e3f2fd",
            color: "#0d47a1",
            p: 1,
            borderRadius: 2,
            fontSize: 13,
            mb: 2,
          }}
        >
          Drag and drop the orders into available weight blocks. You can also move the order to relevant block.
        </Box>

        {/* SUB WIDGETS */}
        <WeightBlock100 />
        <WeightBlock200 />
      </CardContent>
    </Card>
  );
}
