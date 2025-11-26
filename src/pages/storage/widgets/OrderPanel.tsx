import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import { useEffect, useState } from "react";
import Drawer from "@mui/material/Drawer";

import { getOrders, getOrderDetails } from "@/api/orderApi";
import OrderDetailDrawer from "./OrderDetailDrawer";

export default function OrderPanel() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const loadAllDetailsForFullOrders = async () => {
    setLoading(true);
    try {
      const ordersResp = await getOrders({
        pageNumber: 1,
        pageSize: 50,
        style: "full",
      });
      const orders = ordersResp.data ?? [];

      const detailsList = await Promise.all(
        orders.map(async (o) => {
          try {
            const d = await getOrderDetails(o.orderCode);
            return (d.data || []).map((item: any) => ({
              ...item,
              _orderCode: o.orderCode,
              _orderStatus: o.status,
              _orderPaymentStatus: o.paymentStatus,
              _orderDepositDate: o.depositDate,
              _orderReturnDate: o.returnDate,
              _orderTotalPrice: o.totalPrice,
            }));
          } catch (err) {
            console.error("Error fetching details for", o.orderCode, err);
            return [];
          }
        })
      );

      const flat = detailsList.flat();
      setDetails(flat);
    } catch (err) {
      console.error("Load orders error", err);
      setDetails([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllDetailsForFullOrders();
  }, []);

  const handleOpenDetail = (detail: any) => {
    setSelectedDetail(detail);
    setOpen(true);
  };

  const filtered = details.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matches =
      String(d.containerCode ?? "").toLowerCase().includes(q) ||
      String(d._orderCode ?? "").toLowerCase().includes(q) ||
      String(d.storageCode ?? "").toLowerCase().includes(q) ||
      (Array.isArray(d.productTypeIds) && d.productTypeIds.join(",").includes(q)) ||
      (Array.isArray(d.serviceIds) && d.serviceIds.join(",").includes(q));
    return matches;
  });

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          bgcolor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.2}
          >
            <Typography fontWeight={600} fontSize={15}>
              Order 
            </Typography>
          </Box>

          {/* SEARCH */}
          <TextField
            placeholder="Search by Container, Order Code, Storage, Product/Service id..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />

          {/* SUBHEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
          >
            <Typography fontSize={13} fontWeight={600} color="text.secondary">
              Showing {filtered.length} Orders detail  {loading ? " (loading...)" : ""}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton size="small">
                <ViewListOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <MapOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <ViewModuleOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* DETAILS LIST */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              overflowY: "auto",
              pr: 0.5,
            }}
          >
            {filtered.map((d, i) => {
              const bg = i % 2 === 0 ? "#e3f2fd" : "#ede7f6";
              return (
                <Box
                  key={`${d.orderDetailId ?? i}-${i}`}
                  sx={{ width: "calc(50% - 4px)" }}
                  onClick={() => handleOpenDetail(d)}
                >
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      backgroundColor: bg,
                      p: 1.3,
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": {
                        borderColor: theme.palette.primary.light,
                        bgcolor: "#f9fbff",
                      },
                      height: "auto",
                    }}
                  >
                    <Box display="flex" justifyContent="flex-end" mb={0.3}>
                      <DragIndicatorOutlinedIcon
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          opacity: 0.6,
                        }}
                      />
                    </Box>

                    <Typography
                      fontWeight={600}
                      fontSize={13}
                      mb={0.4}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <LockOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                      {d.containerCode ? `Container: ${d.containerCode}` : `Detail #${d.orderDetailId ?? i}`}
                    </Typography>

                    <Box display="flex" gap={1} alignItems="center" mb={0.5}>
                      

                      <Box>
                        <Typography fontSize={12} color="text.secondary">
                          Order: <strong style={{ color: "inherit" }}>{d._orderCode}</strong>
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          Status: {d._orderStatus ?? "-"}
                        </Typography>
                        
                      </Box>
                    </Box>

                  
                    
                    
                  </Card>
                </Box>
              );
            })}
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
              md: "520px",
            },
            height: "100vh",
            borderRadius: {
              xs: 0,
              sm: "12px 0 0 12px",
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
        <OrderDetailDrawer data={selectedDetail} onClose={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
