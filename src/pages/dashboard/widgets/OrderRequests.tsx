import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  useTheme,
  Drawer,
} from "@mui/material";
import { useState } from "react";
import OrderRequestDetail from "./OrderRequestDetail";

export default function OrderRequests() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const orders = [
    {
      id: "ORDERID01",
      customer: "Raj Industries",
      location: "41 Sector 15, Scf, Delhi",
      destination: "C6, Shah Colony, Mumbai",
      date: "17 July 2024, 18:00",
    },
    {
      id: "ORDERID02",
      customer: "Raj Industries",
      location: "41 Sector 15, Scf, Delhi",
      destination: "C6, Shah Colony, Mumbai",
      date: "17 July 2024, 18:00",
    },
  ];

  const handleView = (item: any) => {
    setSelected(item);
    setOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: "12px",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* HEADER */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1.5}
          >
            <Typography fontWeight={600} fontSize={15}>
              Order Requests
            </Typography>
            <Typography
              variant="body2"
              color="primary"
              sx={{
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 13,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View All
            </Typography>
          </Box>

          {/* LIST */}
          <Box display="flex" flexDirection="column" gap={1.5}>
            {orders.map((item, i) => (
              <Box
                key={i}
                sx={{
                  border: "1px solid #eee",
                  borderRadius: 2,
                  p: 1.5,
                  backgroundColor: "#fff9f9",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography fontWeight={600}>{item.id}</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {item.date}
                  </Typography>
                </Box>

                <Typography fontSize={13.5} color="text.secondary">
                  <b>Pickup:</b> {item.location}
                </Typography>
                <Typography fontSize={13.5} color="text.secondary">
                  <b>Destination:</b> {item.destination}
                </Typography>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1.5}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#e3f2fd",
                        color: "#1976d2",
                        fontSize: 13,
                      }}
                    >
                      RI
                    </Avatar>
                    <Typography fontWeight={600} fontSize={13.5}>
                      {item.customer}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => handleView(item)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: 13,
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Drawer chứa chi tiết */}
      <Drawer
  anchor="right"
  open={open}
  onClose={() => setOpen(false)}
  transitionDuration={300}
  PaperProps={{
    sx: (theme) => ({
      width: {
        xs: "100%", 
        sm: "70%",  
        md: "520px" 
      },
      height: "100vh",
      borderRadius: {
        xs: 0,
        sm: "12px 0 0 12px"
      },
      boxShadow: "-6px 0 20px rgba(0,0,0,0.08)",
      overflowY: "auto",
      backgroundColor: theme.palette.background.paper,
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 3,
      },
    }),
  }}
>
  <OrderRequestDetail data={selected} onClose={() => setOpen(false)} />
</Drawer>

    </>
  );
}
