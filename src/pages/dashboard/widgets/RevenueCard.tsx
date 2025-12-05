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
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import dashboardApi from "@/api/dashboardApi";

type RevenuePoint = { label: string; value: number };
type ApiResponseShape = { success?: boolean; date?: string; type?: string; revenue?: number; data?: any };

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const POINTS_PER_TYPE: Record<string, number> = {
  day: 7,
  week: 6,
  month: 6,
  year: 6,
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDateSeries(baseDateISO: string, type: "day" | "week" | "month" | "year", count: number): string[] {
  const base = new Date(baseDateISO + "T00:00:00");
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    switch (type) {
      case "day":
        d.setDate(d.getDate() - i);
        break;
      case "week":
        d.setDate(d.getDate() - i * 7);
        break;
      case "month":
        d.setMonth(d.getMonth() - i);
        break;
      case "year":
        d.setFullYear(d.getFullYear() - i);
        break;
    }
    dates.push(isoDate(d));
  }
  return dates;
}

function parseCumulativeValue(res: any): number | null {
  const apiData: ApiResponseShape | undefined = res?.data;
  if (!apiData) return null;

  if (typeof apiData.revenue === "number") return apiData.revenue;

  if (typeof apiData.data === "number") return apiData.data;


  return null;
}

export default function RevenueCard() {
  const { t } = useTranslation("dashboard");

  const [date, setDate] = useState<string>(() => isoDate(new Date()));
  const [type, setType] = useState<"day" | "week" | "month" | "year">("month");

  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<RevenuePoint[] | null>(null);
  const [revenueTotal, setRevenueTotal] = useState<number | null>(null); 
  const [referenceValue, setReferenceValue] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const count = POINTS_PER_TYPE[type] ?? 6;

        const currentDates = buildDateSeries(date, type, count);

        const promises = currentDates.map((d) =>
          dashboardApi
            .getRevenue({ date: d, type })
            .then((res) => {
              const val = parseCumulativeValue(res);
              return typeof val === "number" ? val : 0;
            })
            .catch((e) => {
              console.error("getRevenue failed for date", d, e);
              return 0;
            })
        );

        const results = await Promise.all(promises); 

        if (!mounted) return;


        const chartSeries: RevenuePoint[] = results.map((val, idx) => ({
          label: currentDates[idx],
          value: val,
        }));

        setSeries(chartSeries);

        const lastVal = chartSeries.length ? chartSeries[chartSeries.length - 1].value : null;
        setRevenueTotal(lastVal ?? null);

        const firstVal = chartSeries.length ? chartSeries[0].value : null;
        setReferenceValue(firstVal ?? null);
      } catch (err) {
        console.error("RevenueCard load failed", err);
        if (mounted) {
          setSeries(null);
          setRevenueTotal(null);
          setReferenceValue(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [date, type]);

  const percentChange = useMemo(() => {
    // compare last cumulative vs first cumulative
    if (revenueTotal == null || referenceValue == null) return null;
    if (referenceValue === 0) return revenueTotal === 0 ? 0 : Infinity;
    return ((revenueTotal - referenceValue) / Math.abs(referenceValue)) * 100;
  }, [revenueTotal, referenceValue]);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", bgcolor: "#fff" }}>
      <CardContent>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography fontWeight={600} display="flex" alignItems="center" gap={1}>
            <MonetizationOnIcon fontSize="small" /> {t("revenue.title")}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            <Select
              size="small"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              sx={{ fontSize: 13, height: 32 }}
            >
              <MenuItem value="day">{t("revenue.period.day")}</MenuItem>
              <MenuItem value="week">{t("revenue.period.week")}</MenuItem>
              <MenuItem value="month">{t("revenue.period.month")}</MenuItem>
              <MenuItem value="year">{t("revenue.period.year")}</MenuItem>
            </Select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ height: 32, borderRadius: 6, border: "1px solid #ddd", padding: "0 8px" }}
            />
          </Box>
        </Box>

        {/* SUMMARY */}
        <Stack direction="row" spacing={2} mb={1}>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "#fff8e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MonetizationOnIcon color="primary" />
            </Box>
            <Box>
              <Typography fontSize={13}>{t("revenue.thisPeriod")}</Typography>
              <Typography fontWeight={600}>
                {loading ? <CircularProgress size={16} /> : revenueTotal != null ? currency.format(revenueTotal) : "—"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
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
              <TrendingUpIcon color="primary" />
            </Box>
            <Box>
              <Typography fontSize={13}>{t("revenue.changeVsPrev")}</Typography>
              <Typography fontWeight={600}>
                {loading ? (
                  <CircularProgress size={16} />
                ) : percentChange === null ? (
                  "—"
                ) : percentChange === Infinity ? (
                  t("revenue.noPreviousData")
                ) : (
                  `${percentChange >= 0 ? "+" : ""}${Math.round(percentChange)}%`
                )}
              </Typography>
            </Box>
          </Box>
        </Stack>

        {/* CHART */}
        <Box sx={{ height: 140 }}>
          {series && series.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={series}>
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip formatter={(value: any) => (typeof value === "number" ? currency.format(value) : value)} />
                <Line type="monotone" dataKey="value" stroke="#3CBD96" strokeWidth={2.5} dot={series.length === 1} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                fontSize: 13,
              }}
            >
              {loading ? "…" : t("revenue.noChartData")}
            </Box>
          )}
        </Box>

        {/* FOOTER */}
        <Box mt={1} display="flex" alignItems="center" gap={0.5}>
          <TrendingUpIcon sx={{ color: percentChange && percentChange > 0 ? "green" : "gray", fontSize: 18 }} />
          <Typography fontSize={13} color={percentChange && percentChange > 0 ? "green" : "text.secondary"}>
            {loading
              ? "…"
              : percentChange === null
              ? t("revenue.noData")
              : percentChange === Infinity
              ? t("revenue.noPreviousData")
              : `${Math.round(percentChange)}%`}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {t("revenue.comparisonText")}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
