import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  MenuItem,
  Select,
  CircularProgress,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import dashboardApi from "@/api/dashboardApi";

type RevenuePoint = {
  label: string;
  netRevenue: number;
  totalPrice?: number;
  totalRefund?: number;
  startDate?: string;
  endDate?: string;
};

type RevenueObject = {
  date?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  totalRefund?: number;
  netRevenue?: number;
  [k: string]: any;
};

type ApiResponseShape = {
  success?: boolean;
  date?: string;
  type?: string;
  revenue?: number | RevenueObject;
  data?: any;
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const POINTS_PER_TYPE: Record<string, number> = {
  day: 7,
  week: 6,
  month: 6,
  year: 6,
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDateSeries(
  baseDateISO: string,
  type: "day" | "week" | "month" | "year",
  count: number
): string[] {
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

function prevPeriodDateISO(dateISO: string, type: "day" | "week" | "month" | "year") {
  const d = new Date(dateISO + "T00:00:00");
  switch (type) {
    case "day":
      d.setDate(d.getDate() - 1);
      break;
    case "week":
      d.setDate(d.getDate() - 7);
      break;
    case "month":
      d.setMonth(d.getMonth() - 1);
      break;
    case "year":
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return isoDate(d);
}

/** parse response => netRevenue + optional totals and start/end */
function parseRevenueObject(res: any): {
  netRevenue: number;
  totalPrice?: number;
  totalRefund?: number;
  startDate?: string;
  endDate?: string;
} | null {
  const apiData: ApiResponseShape | undefined = res?.data;
  if (!apiData) return null;

  if (typeof apiData.revenue === "number") {
    return { netRevenue: apiData.revenue };
  }

  if (apiData.revenue && typeof apiData.revenue === "object") {
    const revObj = apiData.revenue as RevenueObject;
    const net = typeof revObj.netRevenue === "number" ? revObj.netRevenue : undefined;
    const tp = typeof revObj.totalPrice === "number" ? revObj.totalPrice : undefined;
    const tr = typeof revObj.totalRefund === "number" ? revObj.totalRefund : undefined;
    const sd = typeof revObj.startDate === "string" ? revObj.startDate : undefined;
    const ed = typeof revObj.endDate === "string" ? revObj.endDate : undefined;

    if (typeof net === "number") return { netRevenue: net, totalPrice: tp, totalRefund: tr, startDate: sd, endDate: ed };
    if (typeof tp === "number") return { netRevenue: tp, totalPrice: tp, totalRefund: tr, startDate: sd, endDate: ed };
  }

  if (typeof apiData.data === "number") {
    return { netRevenue: apiData.data };
  }
  return null;
}

function formatDateForLabel(dateIso?: string, type?: "day" | "week" | "month" | "year") {
  if (!dateIso) return "—";
  try {
    const d = new Date(dateIso + "T00:00:00");
    if (type === "month") return `${d.getMonth() + 1}/${d.getFullYear()}`;
    if (type === "year") return `${d.getFullYear()}`;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return dateIso;
  }
}

export default function RevenueCard() {
  const { t } = useTranslation("dashboard");

  // === header kept as original ===
  const [date, setDate] = useState<string>(() => isoDate(new Date()));
  const [type, setType] = useState<"day" | "week" | "month" | "year">("month");

  // loading / data
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<RevenuePoint[] | null>(null);

  // current period (last point)
  const [revenueTotal, setRevenueTotal] = useState<number | null>(null); // netRevenue
  const [lastTotalPrice, setLastTotalPrice] = useState<number | null>(null);
  const [lastTotalRefund, setLastTotalRefund] = useState<number | null>(null);
  const [lastStartDate, setLastStartDate] = useState<string | null>(null);
  const [lastEndDate, setLastEndDate] = useState<string | null>(null);

  // previous period (for comparison)
  const [prevRevenue, setPrevRevenue] = useState<number | null>(null);
  const [prevTotalPrice, setPrevTotalPrice] = useState<number | null>(null);
  const [prevTotalRefund, setPrevTotalRefund] = useState<number | null>(null);
  const [prevStartDate, setPrevStartDate] = useState<string | null>(null);
  const [prevEndDate, setPrevEndDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const count = POINTS_PER_TYPE[type] ?? 6;
        const currentDates = buildDateSeries(date, type, count);

        // fetch series points
        const seriesPromises = currentDates.map((d) =>
          dashboardApi
            .getRevenue({ date: d, type })
            .then((res) => {
              const p = parseRevenueObject(res);
              return {
                netRevenue: p?.netRevenue ?? 0,
                totalPrice: p?.totalPrice ?? 0,
                totalRefund: p?.totalRefund ?? 0,
                startDate: p?.startDate,
                endDate: p?.endDate,
              };
            })
            .catch((e) => {
              console.error("getRevenue failed for", d, e);
              return { netRevenue: 0, totalPrice: 0, totalRefund: 0, startDate: undefined, endDate: undefined };
            })
        );

        // fetch previous period once for comparison
        const prevDate = prevPeriodDateISO(date, type);
        const prevPromise = dashboardApi
          .getRevenue({ date: prevDate, type })
          .then((res) => {
            const p = parseRevenueObject(res);
            if (!p) return null;
            return {
              netRevenue: p.netRevenue ?? 0,
              totalPrice: p.totalPrice ?? 0,
              totalRefund: p.totalRefund ?? 0,
              startDate: p.startDate,
              endDate: p.endDate,
            };
          })
          .catch((e) => {
            console.error("getRevenue(prev) failed", prevDate, e);
            return null;
          });

        const [seriesResults, prevResult] = await Promise.all([Promise.all(seriesPromises), prevPromise]);
        if (!mounted) return;

        const chartSeries: RevenuePoint[] = seriesResults.map((r, i) => ({
          label: currentDates[i],
          netRevenue: r.netRevenue,
          totalPrice: r.totalPrice,
          totalRefund: r.totalRefund,
          startDate: r.startDate,
          endDate: r.endDate,
        }));

        setSeries(chartSeries);

        // last point = current selected period
        const lastPoint = chartSeries.length ? chartSeries[chartSeries.length - 1] : null;
        setRevenueTotal(lastPoint ? lastPoint.netRevenue : null);
        setLastTotalPrice(lastPoint && typeof lastPoint.totalPrice === "number" ? lastPoint.totalPrice : null);
        setLastTotalRefund(lastPoint && typeof lastPoint.totalRefund === "number" ? lastPoint.totalRefund : null);
        setLastStartDate(lastPoint && lastPoint.startDate ? lastPoint.startDate : null);
        setLastEndDate(lastPoint && lastPoint.endDate ? lastPoint.endDate : null);

        // prev result -> for comparison
        if (prevResult) {
          setPrevRevenue(typeof prevResult.netRevenue === "number" ? prevResult.netRevenue : null);
          setPrevTotalPrice(typeof prevResult.totalPrice === "number" ? prevResult.totalPrice : null);
          setPrevTotalRefund(typeof prevResult.totalRefund === "number" ? prevResult.totalRefund : null);
          setPrevStartDate(prevResult.startDate ?? null);
          setPrevEndDate(prevResult.endDate ?? null);
        } else {
          setPrevRevenue(null);
          setPrevTotalPrice(null);
          setPrevTotalRefund(null);
          setPrevStartDate(null);
          setPrevEndDate(null);
        }
      } catch (err) {
        console.error("RevenueCard load failed", err);
        if (mounted) {
          setSeries(null);
          setRevenueTotal(null);
          setLastTotalPrice(null);
          setLastTotalRefund(null);
          setLastStartDate(null);
          setLastEndDate(null);
          setPrevRevenue(null);
          setPrevTotalPrice(null);
          setPrevTotalRefund(null);
          setPrevStartDate(null);
          setPrevEndDate(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [date, type]);

  // percent change compared to prevRevenue
  const percentChange = useMemo(() => {
    if (revenueTotal == null || prevRevenue == null) return null;
    if (prevRevenue === 0) return revenueTotal === 0 ? 0 : Infinity;
    return ((revenueTotal - prevRevenue) / Math.abs(prevRevenue)) * 100;
  }, [revenueTotal, prevRevenue]);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", bgcolor: "#fff" }}>
      <CardContent>
        {/* HEADER (KEPT AS ORIGINAL) */}
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

        {/* TOP SUMMARY (3 columns) */}
        <Box display="flex" gap={2} alignItems="flex-start" mb={1}>
          {/* Column 1: current period summary */}
          <Box flex="1" display="flex" gap={1} alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "#fff8e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <MonetizationOnIcon color="primary" />
            </Box>
            <Box>
              <Typography fontSize={13}>{t("revenue.thisPeriod")}</Typography>
              <Typography fontWeight={700} sx={{ fontSize: 20 }}>
                {loading ? <CircularProgress size={18} /> : revenueTotal != null ? currency.format(revenueTotal) : "—"}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {loading
                  ? "…"
                  : `${formatDateForLabel(lastStartDate ?? undefined, type)} — ${formatDateForLabel(lastEndDate ?? undefined, type)}`}
              </Typography>
            </Box>
          </Box>

          {/* Column 2: comparison with previous period */}
          <Box flex="1" textAlign="center">
            <Typography fontSize={13}>{t("revenue.changeVsPrev")}</Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mt: 0.5 }}>
              <TrendingUpIcon sx={{ color: percentChange && percentChange > 0 ? "green" : "gray" }} />
              <Typography fontWeight={700}>
                {loading ? (
                  <CircularProgress size={14} />
                ) : percentChange === null ? (
                  "—"
                ) : percentChange === Infinity ? (
                  t("revenue.noPreviousData")
                ) : (
                  `${percentChange >= 0 ? "+" : ""}${Math.round(percentChange)}%`
                )}
              </Typography>
            </Box>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
              {t("revenue.previousPeriodLabel")}: {loading ? "…" : prevRevenue != null ? currency.format(prevRevenue) : t("revenue.noData")}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {prevStartDate && prevEndDate ? `(${formatDateForLabel(prevStartDate, type)} — ${formatDateForLabel(prevEndDate, type)})` : ""}
            </Typography>
          </Box>

          {/* Column 3: only current totalPrice + totalRefund */}
          <Box flex="1" textAlign="right">
            <Typography fontSize={13}>{t("revenue.auxiliary")}</Typography>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
              {t("revenue.auxiliary.totalPrice")}:
            </Typography>
            <Typography fontWeight={700}>
              {loading ? <CircularProgress size={14} /> : lastTotalPrice != null ? currency.format(lastTotalPrice) : "—"}
            </Typography>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
              {t("revenue.auxiliary.totalRefund")}:
            </Typography>
            <Typography fontWeight={700}>
              {loading ? <CircularProgress size={14} /> : lastTotalRefund != null ? currency.format(lastTotalRefund) : "—"}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* BIG CHART (below) */}
        <Box sx={{ height: 220, mt: 2 }}>
          {series && series.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={series}>
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip
                  formatter={(value: any) => (typeof value === "number" ? currency.format(value) : value)}
                  content={(props: any) => {
                    const { active, payload, label } = props;
                    if (active && payload && payload.length) {
                      const p = payload[0].payload as RevenuePoint;
                      return (
                        <Box sx={{ bgcolor: "#fff", borderRadius: 1, p: 1, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                          <Typography variant="caption">{label}</Typography>
                          <Typography fontWeight={600}>{currency.format(p.netRevenue)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {p.totalPrice != null ? `${t("revenue.auxiliary.totalPrice")}: ${currency.format(p.totalPrice)}` : ""}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {p.totalRefund != null ? `${t("revenue.auxiliary.totalRefund")}: ${currency.format(p.totalRefund)}` : ""}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="netRevenue" stroke="#3CBD96" strokeWidth={2.5} dot={false} />
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

        {/* FOOTER small note */}
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
