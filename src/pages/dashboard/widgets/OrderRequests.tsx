import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  useTheme,
  Drawer,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import OrderRequestDetail from "./OrderRequestDetail";
import * as orderApi from "@/api/orderApi";

type UiOrderRow = {
  id: string;
  customer: string; 
  phone?: string | null;
  address?: string | null;
  location?: string;
  destination?: string;
  date?: string;
  imageUrls?: string[] | null;
  raw: orderApi.OrderRespItem;
};

export default function OrderRequests() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); 
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [rows, setRows] = useState<UiOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTop5 = async () => {
    setLoading(true);
    try {
      const resp = await orderApi.getOrders({ page: 1, pageSize: 5 });
      const list = resp.data ?? [];
      const mapped: UiOrderRow[] = list.map((o) => ({
        id: o.orderCode,
        customer: o.customerName ?? o.customerCode ?? "-",
        phone: o.phoneContact ?? null,
        address: o.address ?? null,
        location: o.depositDate ? `${t("orderRequests.deposit")}: ${o.depositDate}` : "-",
        destination: o.returnDate ? `${t("orderRequests.return")}: ${o.returnDate}` : "-",
        date: o.orderDate ?? o.depositDate ?? "-",
        imageUrls: o.imageUrls ?? null,
        raw: o,
      }));
      setRows(mapped);
    } catch (err) {
      console.error("getOrders failed", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop5();
  }, []);

  const handleView = async (item: UiOrderRow) => {
    setSelected({
      id: item.id,
      customer: item.customer,
      phone: item.phone ?? null,
      address: item.address ?? null,
      location: item.location,
      destination: item.destination,
      date: item.date,
      rawOrder: item.raw,
      orderDetails: [],
      orderMeta: { success: false, message: "" },
    });
    setOpen(true);
    setDetailLoading(true);

    try {
      const [orderFull, detailsResp] = await Promise.all([
        orderApi.getOrder(item.id).catch((e) => {
          console.error("getOrder failed", e);
          return null;
        }),
        orderApi.getOrderDetails(item.id).catch((e) => {
          console.error("getOrderDetails failed", e);
          return { success: false, message: (e as any)?.message ?? "failed", data: [] as any[] };
        }),
      ]);

      const composed = {
        id: item.id,
        customer: orderFull?.customerName ?? item.customer,
        phone: orderFull?.phoneContact ?? item.phone ?? null,
        address: orderFull?.address ?? item.address ?? null,
        location: orderFull?.address ?? item.address ?? "-",
        destination: orderFull?.address ?? item.address ?? "-",
        date: orderFull?.orderDate ?? item.date,
        rawOrder: orderFull ?? item.raw,
        orderDetails: detailsResp?.data ?? [],
        orderMeta: { success: detailsResp?.success ?? false, message: detailsResp?.message ?? "" },
      };

      setSelected(composed);
    } catch (err) {
      console.error("handleView error", err);
      setSelected((prev: any) =>
        prev
          ? { ...prev, orderDetails: [] }
          : {
              id: item.id,
              customer: item.customer,
              phone: item.phone ?? null,
              address: item.address ?? null,
              location: item.location,
              destination: item.destination,
              date: item.date,
              rawOrder: item.raw,
              orderDetails: [],
            }
      );
    } finally {
      setDetailLoading(false);
    }
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
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {/* HEADER */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography fontWeight={600} fontSize={15}>
              {t("orderRequests.title")}
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
              onClick={fetchTop5}
            >
              {t("orderRequests.viewAll")}
            </Typography>
          </Box>

          {/* LIST */}
          <Box display="flex" flexDirection="column" gap={1.25}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              rows.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 2,
                    p: { xs: 1, sm: 1.5 },
                    backgroundColor: "#fff9f9",
                    cursor: "pointer",
                    "&:active": { transform: "scale(0.998)" },
                  }}
                  onClick={() => handleView(item)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontWeight={600} fontSize={14}>
                      {item.id}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {item.date}
                    </Typography>
                  </Box>

                  <Typography fontSize={13} color="text.secondary">
                    <b>{t("orderRequests.pickupLabel")}</b> {item.address}
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    <b>{t("orderRequests.destinationLabel")}</b> {item.address}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.25}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : undefined}
                        sx={{
                          width: { xs: 32, sm: 28 },
                          height: { xs: 32, sm: 28 },
                          bgcolor: item.imageUrls && item.imageUrls.length > 0 ? undefined : "#e3f2fd",
                          color: "#1976d2",
                          fontSize: 13,
                        }}
                      >
                        {String((item.customer ?? "C").slice(0, 2)).toUpperCase()}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={600} fontSize={13.5}>
                          {item.customer}
                        </Typography>
                        {/* show phone and address if available */}
                        <Typography fontSize={12} color="text.secondary">
                          {item.phone ? `${item.phone}` : item.address ? `${item.address}` : ""}
                        </Typography>
                      </Box>
                    </Box>

                    {/* On mobile we rely on tapping the card; on desktop show explicit button */}
                    {!isXs && (
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(item);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: 13,
                        }}
                      >
                        {t("orderRequests.viewDetails")}
                      </Button>
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Drawer chứa chi tiết */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        transitionDuration={300}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: (theme) => ({
            width: isXs ? "100%" : { sm: "70%", md: "520px" },
            maxWidth: "100%",
            height: "100vh",
            borderRadius: isXs ? 0 : "12px 0 0 12px",
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
        {detailLoading ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: "100vh", boxSizing: "border-box" }}>
            <OrderRequestDetail
              data={selected}
              onClose={() => {
                setOpen(false);
                setSelected(null);
              }}
            />
          </Box>
        )}
      </Drawer>
    </>
  );
}
