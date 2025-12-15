import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Stack, CircularProgress, Select, MenuItem } from "@mui/material";
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
  "Cancelled"
];

const COLORS = [
  "#0d47a1",
  "#1976d2",
  "#64b5f6",
  "#ef5350",
  "#9c27b0",
  "#ff9800",
  "#f44336",
  "#00bfa5",
  "#00d146",
  "#795548",
  "#9c0202",
  "#6a1b9a",
  "#000000ff",
];

export default function LoadingTrucks() {
  const { t } = useTranslation("dashboard");

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"day" | "week" | "month" | "year">("month");

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
    cancelled:"cancelled"
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
            .getOrderCount({ date, status: s, type })
            .then((res) => res?.data?.data?.totalOrders ?? 0)
            .catch(() => 0)
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
  }, [date, type]);

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

        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={600}>{t("orderStatus.title")}</Typography>

          {/* NEW — period selector + date */}
          <Box display="flex" alignItems="center" gap={1}>
            <Select
              size="small"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              sx={{ fontSize: 13, height: 32 }}
            >
              <MenuItem value="day">{t("recentOrders.period.day")}</MenuItem>
              <MenuItem value="week">{t("recentOrders.period.week")}</MenuItem>
              <MenuItem value="month">{t("recentOrders.period.month")}</MenuItem>
              <MenuItem value="year">{t("recentOrders.period.year")}</MenuItem>
            </Select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                height: 32,
                borderRadius: 6,
                border: "1px solid #ddd",
                padding: "0 8px",
              }}
            />
          </Box>
        </Box>

        {/* CONTENT */}
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
            {(data ?? []).map((d, i) => (
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
