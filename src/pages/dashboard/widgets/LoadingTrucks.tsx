import {
  Card, CardContent, Typography, Box, Stack,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function LoadingTrucks() {
  const COLORS = ["#0d47a1", "#1976d2", "#64b5f6", "#ef5350"];
  const data = [
    { name: "Active", value: 40 },
    { name: "Loading Delayed", value: 23 },
    { name: "Ready to Load", value: 12 },
    { name: "Unloading Delayed", value: 12 },
    { name: "Ready to Un-load", value: 3 },
    { name: "Canceled", value: 3 },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", bgcolor: "#fff" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={600}>Loading Trucks</Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
            View All
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ width: "45%", height: 180 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.slice(0, 3)}
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.slice(0, 3).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <Typography align="center" fontWeight={600} mt={-12}>
              120
            </Typography>
            <Typography align="center" variant="body2">
              Total Trucks
            </Typography>
          </Box>

          <Stack spacing={0.6}>
            {data.slice(0, 6).map((d, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 3, height: 18, bgcolor: COLORS[i % COLORS.length], borderRadius: 1 }} />
                <Typography fontSize={13}>{d.name}</Typography>
                <Typography fontSize={13} fontWeight={600}>
                  {d.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
