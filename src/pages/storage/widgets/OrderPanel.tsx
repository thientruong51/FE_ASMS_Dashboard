import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import { useEffect, useState, useCallback } from "react";
import Drawer from "@mui/material/Drawer";

import { getOrders, getOrderDetails } from "@/api/orderApi";
import { getProductTypes } from "@/api/productTypeApi";
import { getServices } from "@/api/serviceApi";
import OrderDetailDrawer from "./OrderDetailDrawer";

export default function OrderPanel() {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); // >=600
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >=900

  const [search, setSearch] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("success");

  const loadAllDetailsForFullOrders = useCallback(async () => {
    setLoading(true);
    try {
      // --- build lookups name -> id for product types and services ---
      const productTypeNameToId: Record<string, number> = {};
      const serviceNameToId: Record<string, number> = {};

      try {
        // getProductTypes returns ProductTypeListResponse
        const ptResp = await getProductTypes({ pageSize: 1000 });
        const pts = ptResp?.data ?? [];
        pts.forEach((p: any) => {
          const name = String(p.name ?? "").trim();
          const id = p.productTypeId ?? (p.id as number | undefined);
          if (name && id != null) productTypeNameToId[name] = id;
        });
      } catch (err) {
        console.warn("getProductTypes failed", err);
      }

      try {
        // getServices returns Service[]
        const ss = await getServices();
        ss.forEach((s: any) => {
          const name = String(s.name ?? "").trim();
          const id = s.serviceId ?? (s.id as number | undefined);
          if (name && id != null) serviceNameToId[name] = id;
        });
      } catch (err) {
        console.warn("getServices failed", err);
      }

      // 1) Lấy danh sách orders với style = "full"
      const ordersResp = await getOrders({
        pageNumber: 1,
        pageSize: 50,
        style: "full",
      });
      const orders = ordersResp.data ?? [];

      // 2) Với mỗi order, lấy details rồi filter isPlaced === null
      const detailsList = await Promise.all(
        orders.map(async (o) => {
          try {
            const resp = await getOrderDetails(o.orderCode);
            const items = resp.data ?? [];

            const mapped = items.map((item: any) => {
              // If backend already returned ids, prefer them
              let productTypeIds: number[] =
                Array.isArray(item.productTypeIds) && item.productTypeIds.length
                  ? item.productTypeIds
                  : [];

              let serviceIds: number[] =
                Array.isArray(item.serviceIds) && item.serviceIds.length ? item.serviceIds : [];

              // If ids not provided, derive from names using lookups
              const namesPT: string[] = Array.isArray(item.productTypeNames)
                ? item.productTypeNames.map((n: any) => String(n).trim())
                : [];

              if (!productTypeIds.length && namesPT.length) {
                productTypeIds = namesPT
                  .map((nm) => productTypeNameToId[nm])
                  .filter((v) => v != null) as number[];
              }

              const namesS: string[] = Array.isArray(item.serviceNames)
                ? item.serviceNames.map((n: any) => String(n).trim())
                : [];

              if (!serviceIds.length && namesS.length) {
                serviceIds = namesS
                  .map((nm) => serviceNameToId[nm])
                  .filter((v) => v != null) as number[];
              }

              return {
                ...item,
                // keep names as backup
                productTypeNames: namesPT,
                serviceNames: namesS,
                productTypeIds, // may be []
                serviceIds, // may be []
                _orderCode: o.orderCode,
                _orderStatus: o.status,
                _orderPaymentStatus: o.paymentStatus,
                _orderDepositDate: o.depositDate,
                _orderReturnDate: o.returnDate,
                _orderTotalPrice: o.totalPrice,
              };
            });

            // chỉ giữ item có isPlaced === null
            return mapped.filter((it: any) => it.isPlaced === false);
          } catch (err) {
            console.error("Error fetching details for", o.orderCode, err);
            return [];
          }
        })
      );

      // 3) Flatten và set state
      const flat = detailsList.flat();
      setDetails(flat);
    } catch (err) {
      console.error("Load orders error", err);
      setDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDetailsForFullOrders();
  }, [loadAllDetailsForFullOrders]);

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
      (Array.isArray(d.productTypeIds) &&
        d.productTypeIds.join(",").toLowerCase().includes(q)) ||
      (Array.isArray(d.serviceIds) && d.serviceIds.join(",").toLowerCase().includes(q));
    return matches;
  });

  const handleOnPlaced = (result: { success: boolean; data: any }) => {
    if (result?.success) {
      setSnackMsg("Placed successfully.");
      setSnackSeverity("success");
    } else {
      const msg = (result?.data && (result.data.error || JSON.stringify(result.data))) || "Place failed.";
      setSnackMsg(`Place failed: ${msg}`);
      setSnackSeverity("error");
    }
    setSnackOpen(true);

    // close drawer
    setOpen(false);

    // reload data
    loadAllDetailsForFullOrders();
  };

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
            p: { xs: 2, sm: 2.5 },
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
            flexDirection={isSmUp ? "row" : "column"}
            gap={1}
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
            flexDirection={isSmUp ? "row" : "column"}
            gap={1}
          >
            <Typography fontSize={13} fontWeight={600} color="text.secondary">
              Showing {filtered.length} Orders detail {loading ? " (loading...)" : ""}
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
              maxHeight: { xs: "65vh", sm: "none" },
            }}
          >
            {filtered.map((d, i) => {
              const bg = i % 2 === 0 ? "#e3f2fd" : "#ede7f6";
              return (
                <Box
                  key={`${d.orderDetailId ?? i}-${i}`}
                  sx={{
                    width: {
                      xs: "100%", // responsive: mobile 1 column
                      sm: "calc(50% - 4px)", // desktop/tablet 2 columns
                    },
                  }}
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
                          Order: <strong>{d._orderCode}</strong>
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

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        transitionDuration={300}
        PaperProps={{
          sx: {
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
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 3,
            },
          },
        }}
      >
        <OrderDetailDrawer data={selectedDetail} onClose={() => setOpen(false)} onPlaced={handleOnPlaced} />
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
