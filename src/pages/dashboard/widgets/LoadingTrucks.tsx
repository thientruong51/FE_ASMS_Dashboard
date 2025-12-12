import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Stack, CircularProgress } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import dashboardApi from "@/api/dashboardApi";


const statusesList = [
  "Pending",
  "Wait pick up",
  "Verify",
  "Checkout",
  "Pick up",
  "Delivered",
  "Processing",
  "Stored",
  "Renting",
  "Overdue",
  "Retrieved",
  "Completed",
];

const COLORS = [
  "#0d47a1", // Pending
  "#1976d2", // Wait pick up
  "#64b5f6", // Verify
  "#ef5350", // Checkout
  "#9c27b0", // Pick up
  "#ff9800", // Delivered
  "#f44336", // Processing
  "#00bfa5", // Stored
  "#00d146", // Renting
  "#795548", // Overdue
  "#9c0202", // Retrieved
  "#6a1b9a", // Completed
];

export default function LoadingTrucks() {
  const { t } = useTranslation("dashboard");
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const [isWeekly] = useState(false);
  const [data, setData] = useState<{ name: string; value: number }[] | null>(null);
  const [loading, setLoading] = useState(true);

  const normalize = (s?: string | null) => (s ?? "").toString().trim().toLowerCase();

  const statusKeyMap: Record<string, string> = {
    "processing order": "processing",
    "order retrieved": "retrieved",
    "order created": "pending",
    pending: "pending",
    processing: "processing",
    retrieved: "retrieved",
    "wait pick up": "wait_pick_up",
    "wait_pick_up": "wait_pick_up",
    "wait-pick-up": "wait_pick_up",
    verify: "verify",
    checkout: "checkout",
    "pick up": "pick_up",
    "pick_up": "pick_up",
    "pick-up": "pick_up",
    delivered: "delivered",
    renting: "renting",
    stored: "stored",
    overdue: "overdue",
    "store in expired storage": "store_in_expired_storage",
    completed: "completed",
  };

  const canonicalStatusKey = (s?: string | null) => {
    const n = normalize(s);
    if (!n) return "";
    return statusKeyMap[n] ?? n.replace(/\s+/g, "_");
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const promises = statusesList.map((s) =>
          dashboardApi
            .getOrderCount({ date, status: s, isWeekly })
            .then((res) => {
              const apiData = res.data;
              return typeof apiData?.data === "number" ? apiData.data : 0;
            })
            .catch((e) => {
              console.error("getOrderCount error", s, e);
              return 0;
            })
        );

        const results = await Promise.all(promises);
        if (!mounted) return;

        const pieData = statusesList.map((name, i) => ({
          name,
          value: results[i],
        }));
        setData(pieData);
      } catch (err) {
        console.error("LoadingTrucks load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [date, isWeekly]);

  const total = data ? data.reduce((a, b) => a + b.value, 0) : 0;

  const translatedStatusLabel = (name: string) => {
    const key = canonicalStatusKey(name);
    return key ? t(`statusNames.${key}`, { defaultValue: name }) : name;
  };

  const mapKeyToIndex: Record<string, number> = {
    pending: 0,
    wait_pick_up: 1,
    verify: 2,
    checkout: 3,
    pick_up: 4,
    delivered: 5,
    processing: 6,
    stored: 7,
    renting: 8,
    overdue: 9,
    retrieved: 10,
    completed: 11,
    store_in_expired_storage: 9, 
  };

  const statusColorFor = (name: string, idx: number) => {
    const key = canonicalStatusKey(name);
    return COLORS[mapKeyToIndex[key] ?? (idx % COLORS.length)];
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", bgcolor: "#fff" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={600}>{t("orderStatus.title")}</Typography>
         
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ width: "45%", height: 180 }}>
            {loading ? (
              <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 180 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data?.filter((d) => d.value > 0) ?? []}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(data?.filter((d) => d.value > 0) ?? []).map((entry, index) => (
                      <Cell key={entry.name} fill={statusColorFor(entry.name, index)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            <Typography align="center" fontWeight={600} mt={-12}>
              {loading ? "…" : total}
            </Typography>
            <Typography align="center" variant="body2">
              {t("orderStatus.totalOrders")}
            </Typography>
          </Box>

          <Stack spacing={0.6}>
            {(data ?? []).slice(0, 12).map((d, i) => (
              <Box key={d.name} display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: statusColorFor(d.name, i),
                    borderRadius: 2,
                  }}
                />
                <Typography fontSize={13} sx={{ minWidth: 160 }}>
                  {translatedStatusLabel(d.name)}
                </Typography>
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
