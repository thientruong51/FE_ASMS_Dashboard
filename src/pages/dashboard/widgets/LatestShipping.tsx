import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";

export default function LatestShipping() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <600px

  const rows = [
    { id: "ORDERID01", status: "Delivered", customer: "Raj Industries", departure: "Delhi", weight: "250 KG", arrival: "Mumbai", date: "17 July 2024" },
    { id: "ORDERID01", status: "Canceled", customer: "Raj Industries", departure: "Delhi", weight: "250 KG", arrival: "Mumbai", date: "17 July 2024" },
    { id: "ORDERID01", status: "Active", customer: "Raj Industries", departure: "Delhi", weight: "250 KG", arrival: "Mumbai", date: "17 July 2024" },
    { id: "ORDERID01", status: "Delivered", customer: "Raj Industries", departure: "Delhi", weight: "250 KG", arrival: "Mumbai", date: "17 July 2024" },
  ];

  const renderStatus = (status: string) => {
    const chipBase = {
      size: "small" as const,
      variant: "outlined" as const,
      sx: {
        fontWeight: 500,
        fontSize: 13,
        px: 1.2,
        borderRadius: "6px",
        minWidth: 78,
        justifyContent: "center",
      },
    };

    switch (status) {
      case "Delivered":
        return (
          <Chip
            {...chipBase}
            label="Delivered"
            sx={{
              ...chipBase.sx,
              color: "#1976d2",
              borderColor: "#90caf9",
              backgroundColor: "#f5f9ff",
            }}
          />
        );
      case "Canceled":
        return (
          <Chip
            {...chipBase}
            label="Canceled"
            sx={{
              ...chipBase.sx,
              color: "#e53935",
              borderColor: "#ef9a9a",
              backgroundColor: "#fff6f6",
            }}
          />
        );
      case "Active":
        return (
          <Chip
            {...chipBase}
            label="Active"
            sx={{
              ...chipBase.sx,
              color: "#2e7d32",
              borderColor: "#a5d6a7",
              backgroundColor: "#f4fff4",
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        {/* HEADER */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
          flexWrap="wrap"
        >
          <Typography fontWeight={600} fontSize={{ xs: 14, md: 15 }}>
            Latest Shipping
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{
              cursor: "pointer",
              fontWeight: 500,
              fontSize: { xs: 12.5, md: 13 },
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View All
          </Typography>
        </Box>

        {/* DESKTOP TABLE */}
        {!isMobile && (
          <>
            {/* HEADER ROW */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "1.2fr 1.1fr 1.5fr 1fr 1fr 1fr 1.4fr",
                py: 1,
                borderBottom: "1px solid #e5e7eb",
                background: "#fafafa",
                borderRadius: "6px",
                px: 1.5,
              }}
            >
              {[
                "ORDER ID",
                "STATUS",
                "CUSTOMER",
                "DEPARTURE",
                "WEIGHT",
                "ARRIVAL",
                "ARRIVAL DATE",
              ].map((head, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  {head}
                </Typography>
              ))}
            </Box>

            {/* ROWS */}
            {rows.map((r, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 1.1fr 1.5fr 1fr 1fr 1fr 1.4fr",
                  alignItems: "center",
                  py: 1.3,
                  px: 1.5,
                  borderBottom:
                    i !== rows.length - 1 ? "1px solid #f1f1f1" : "none",
                  transition: "background 0.15s",
                  "&:hover": { backgroundColor: "#f9fbff" },
                }}
              >
                <Typography fontSize={14}>{r.id}</Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  {renderStatus(r.status)}
                </Box>
                <Typography fontSize={14}>{r.customer}</Typography>
                <Typography fontSize={14}>{r.departure}</Typography>
                <Typography fontSize={14}>{r.weight}</Typography>
                <Typography fontSize={14}>{r.arrival}</Typography>
                <Typography fontSize={14}>{r.date}</Typography>
              </Box>
            ))}
          </>
        )}

        {/* MOBILE CARD LIST */}
        {isMobile && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rows.map((r, i) => (
              <Box
                key={i}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 1.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  "&:hover": { backgroundColor: "#fafafa" },
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography fontWeight={600}>{r.id}</Typography>
                  {renderStatus(r.status)}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Customer: <b>{r.customer}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From: <b>{r.departure}</b> → To: <b>{r.arrival}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weight: {r.weight}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Arrival: {r.date}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
