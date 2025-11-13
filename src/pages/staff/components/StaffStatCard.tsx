import { Card, CardContent, Box, Typography } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";

interface Props {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export default function StaffStatCard({ title, value, icon, trend, color = "#3b82f6" }: Props) {

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.12)",
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flex: "1 1 auto" }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: { xs: 12, sm: 13 } }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color, fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" } }}
            >
              {value}
            </Typography>

            {trend && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                {trend.isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "success.main" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "error.main" }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? "success.main" : "error.main",
                    fontWeight: 600,
                    fontSize: { xs: 11, sm: 12 },
                  }}
                >
                  {Math.abs(trend.value)}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 11, sm: 12 } }}>
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              width: { xs: 56, sm: 56 },
              height: { xs: 56, sm: 56 },
              borderRadius: 2,
              bgcolor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              flexShrink: 0,
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Box sx={{ fontSize: { xs: 20, sm: 26 } }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
