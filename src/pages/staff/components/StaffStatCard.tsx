import { Card, CardContent, Box, Typography} from "@mui/material";
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
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                {trend.isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 18, color: "success.main" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 18, color: "error.main" }} />
                )}
                <Typography
                  variant="caption"
                  color={trend.isPositive ? "success.main" : "error.main"}
                  fontWeight={600}
                >
                  {Math.abs(trend.value)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}