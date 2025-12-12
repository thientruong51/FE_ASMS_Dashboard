import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  MenuItem,
  Select,
  CircularProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import dashboardApi from "@/api/dashboardApi";

type Point = { x: string; value: number };

const POINTS_PER_MODE: Record<string, number> = {
  month: 6,
  week: 6,
  day: 7,
  year: 6, 
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDateSeries(
  baseDateISO: string,
  mode: "day" | "week" | "month" | "year",
  count: number
) {
  const base = new Date(baseDateISO + "T00:00:00");
  const dates: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);

    if (mode === "day") d.setDate(d.getDate() - i);
    else if (mode === "week") d.setDate(d.getDate() - i * 7);
    else if (mode === "month") d.setMonth(d.getMonth() - i);
    else if (mode === "year") d.setFullYear(d.getFullYear() - i);

    dates.push(isoDate(d));
  }
  return dates;
}

function parseCountResponse(res: any): number {
  return res?.data?.data?.totalOrders ?? 0;
}

export default function RecentOrders() {
  const { t } = useTranslation("dashboard");

  const [date, setDate] = useState(() => isoDate(new Date()));

  const [mode, setMode] = useState<"month" | "week" | "day" | "year">("month");

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const statusGroups = useMemo(
    () => [
      {
        key: "active",
        label: t("recentOrders.groups.active"),
        statuses: ["Renting", "Stored", "Pick up", "Processing", "Checkout", "Delivered"],
        icon: <InboxIcon color="primary" />,
      },
      {
        key: "pending",
        label: t("recentOrders.groups.pending"),
        statuses: ["Pending", "Wait pick up", "Verify"],
        icon: <HourglassEmptyIcon color="primary" />,
      },
      {
        key: "completed",
        label: t("recentOrders.groups.completed"),
        statuses: ["Retrieved", "Completed"],
        icon: <CheckCircleOutlineIcon color="primary" />,
      },
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const promises = statusGroups.map(async (g) => {
          const calls = g.statuses.map((s) =>
            dashboardApi
              .getOrderCount({ date, status: s, type: mode })
              .then(parseCountResponse)
              .catch(() => 0)
          );

          const values = await Promise.all(calls);
          return { key: g.key, total: values.reduce((a, b) => a + b, 0) };
        });

        const results = await Promise.all(promises);
        if (!mounted) return;

        const next: Record<string, number> = {};
        results.forEach((r) => (next[r.key] = r.total));
        setCounts(next);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [date, mode, statusGroups]);

  const [chartLoading, setChartLoading] = useState(true);
  const [chartData, setChartData] = useState<Point[]>([]);

  useEffect(() => {
    let mounted = true;
    setChartLoading(true);

    (async () => {
      try {
        const count = POINTS_PER_MODE[mode];
        const dates = buildDateSeries(date, mode, count);

        const allStatuses = Array.from(new Set(statusGroups.flatMap((g) => g.statuses)));

        const totals = await Promise.all(
          dates.map(async (d) => {
            const calls = allStatuses.map((s) =>
              dashboardApi
                .getOrderCount({ date: d, status: s, type: mode })
                .then(parseCountResponse)
                .catch(() => 0)
            );

            const values = await Promise.all(calls);
            return values.reduce((a, b) => a + b, 0);
          })
        );

        if (!mounted) return;

        setChartData(
          dates.map((d, idx) => ({
            x: d,
            value: totals[idx] ?? 0,
          }))
        );
      } finally {
        if (mounted) setChartLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [date, mode, statusGroups]);

  const percentText = useMemo(() => {
    if (chartLoading || chartData.length === 0) return "…";

    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;

    if (first === 0) return last === 0 ? "0%" : "∞";

    return `${Math.round(((last - first) / Math.abs(first)) * 100)}%`;
  }, [chartLoading, chartData]);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
      <CardContent>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography fontWeight={600}>{t("recentOrders.title")}</Typography>

          <Box display="flex" gap={1} alignItems="center">
            <Select
              value={mode}
              size="small"
              onChange={(e) => setMode(e.target.value as any)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="year">{t("recentOrders.period.year")}</MenuItem> 
              <MenuItem value="month">{t("recentOrders.period.month")}</MenuItem>
              <MenuItem value="week">{t("recentOrders.period.week")}</MenuItem>
              <MenuItem value="day">{t("recentOrders.period.day")}</MenuItem>
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

        {/* SUMMARY GROUPS */}
        <Stack direction="row" spacing={2}>
          {statusGroups.map((g) => (
            <Box key={g.key} sx={{ flex: 1, display: "flex", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#f1f5ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {g.icon}
              </Box>

              <Box>
                <Typography fontSize={13}>{g.label}</Typography>
                <Typography fontWeight={600}>
                  {loading ? <CircularProgress size={16} /> : counts[g.key] ?? 0}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        {/* CHART */}
        <Box sx={{ height: 140, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={chartData.map((p) => ({ day: p.x, value: p.value }))}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3CBD96" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* PERCENT CHANGE */}
        <Box mt={1} display="flex" gap={0.5} alignItems="center">
          <TrendingUpIcon sx={{ color: "green", fontSize: 18 }} />
          <Typography fontSize={13} color="green">
            {percentText}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {t("recentOrders.comparisonText")}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
