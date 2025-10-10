import {
  Card, CardContent, Typography, Box, Stack, MenuItem, Select,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function RecentOrders() {
  const stats = [
    { icon: <InboxIcon color="primary" />, label: "Active Orders", value: 720 },
    { icon: <HourglassEmptyIcon color="primary" />, label: "Pending Req", value: 120 },
    { icon: <CheckCircleOutlineIcon color="primary" />, label: "Accepted", value: 450 },
  ];
  const data = [
    { day: 1, value: 20 },
    { day: 5, value: 60 },
    { day: 10, value: 100 },
    { day: 15, value: 150 },
    { day: 25, value: 250 },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", bgcolor: "#fff" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography fontWeight={600}>Recent Orders</Typography>
          <Select size="small" defaultValue="July" sx={{ fontSize: 13, height: 32 }}>
            <MenuItem value="Jan">January</MenuItem>
            <MenuItem value="Feb">February</MenuItem>
            <MenuItem value="Mar">March</MenuItem>
            <MenuItem value="July">July</MenuItem>
          </Select>
        </Box>

        <Stack direction="row" spacing={2} mb={1}>
          {stats.map((s, i) => (
            <Box key={i} sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#f1f5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.icon}
              </Box>
              <Box>
                <Typography fontSize={13}>{s.label}</Typography>
                <Typography fontWeight={600}>{s.value}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        <Box sx={{ height: 140 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1976d2"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box mt={1} display="flex" alignItems="center" gap={0.5}>
          <TrendingUpIcon sx={{ color: "green", fontSize: 18 }} />
          <Typography fontSize={13} color="green">
            +40%
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            in comparison to last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
