// src/pages/PaymentHistory/components/PaymentHistoryDetailDrawer.tsx
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import PaymentIcon from "@mui/icons-material/Payment";
import * as paymentApi from "@/api/paymentHistoryApi";

type Props = {
  code: string | null;
  open: boolean;
  onClose: () => void;
  item?: paymentApi.PaymentHistoryItem | undefined;
};

export default function PaymentHistoryDetailDrawer({ code, open, onClose, item }: Props) {
  const [loading, setLoading] = useState(false);
  // explicit state type
  const [data, setData] = useState<paymentApi.PaymentHistoryItem | null>(item ?? null);

  useEffect(() => {
    // if parent passed item we prefer it (and keep it typed)
    if (item) {
      setData(item);
      return;
    }

    // if no code or not open, clear
    if (!open || !code) {
      setData(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // getPaymentHistory is typed to return PaymentHistoryItem (see api file)
        const resp = await paymentApi.getPaymentHistory(code);
        // resp should be PaymentHistoryItem according to our api typings
        if (!mounted) return;
        setData(resp ?? null);
      } catch (err) {
        console.error("getPaymentHistory failed", err);
        if (!mounted) return;
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [code, open, item]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  // safe render helpers
  const formatNumber = (v: any) => (v == null ? "-" : Number(v).toLocaleString());

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 560, md: 720 } } }}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Box>
              <Typography fontWeight={800} sx={{ fontSize: 18 }}>
                Payment {code ?? ""}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                Payment history detail
              </Typography>
            </Box>
          </Box>

          <Box>
            <IconButton onClick={onClose} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
          {/* Header */}
          <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "#eef7f1", color: "success.main" }}>
              <PaymentIcon />
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{data?.paymentMethod ?? "-"}</Typography>
              <Typography variant="caption" color="text.secondary">
                Platform: {data?.paymentPlatform ?? "-"}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto", textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                Amount
              </Typography>
              <Typography fontWeight={800}>{data?.amount != null ? formatNumber(data.amount) : "-"}</Typography>
            </Box>
          </Box>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={1}>
                {/* Use has(...) to avoid rendering empty fields */}
                {has(data?.paymentHistoryCode) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>Code</Box>
                    <Box sx={{ flex: 1 }}>{data!.paymentHistoryCode}</Box>
                  </Box>
                )}

                {has(data?.orderCode) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>Order</Box>
                    <Box sx={{ flex: 1 }}>{data!.orderCode}</Box>
                  </Box>
                )}

                {has(data?.paymentMethod) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>Method</Box>
                    <Box sx={{ flex: 1 }}>{data!.paymentMethod}</Box>
                  </Box>
                )}

                {has(data?.paymentPlatform) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>Platform</Box>
                    <Box sx={{ flex: 1 }}>{data!.paymentPlatform}</Box>
                  </Box>
                )}

                {has(data?.amount) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>Amount</Box>
                    <Box sx={{ flex: 1 }}>{formatNumber(data!.amount)}</Box>
                  </Box>
                )}

                {/* If there are any other keys, show them defensively */}
                {data &&
                  Object.keys(data)
                    .filter((k) => !["paymentHistoryCode", "orderCode", "paymentMethod", "paymentPlatform", "amount"].includes(k))
                    .map((k) => {
                      const v = (data as any)[k];
                      if (!has(v)) return null;
                      return (
                        <Box key={k} sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ width: 160, color: "text.secondary" }}>{k}</Box>
                          <Box sx={{ flex: 1 }}>{String(v)}</Box>
                        </Box>
                      );
                    })}
              </Stack>
            </CardContent>
          </Card>

          {/* Loading / empty states */}
          {loading && <Typography color="text.secondary">Loading...</Typography>}
          {!loading && !data && <Typography color="text.secondary">No data available</Typography>}
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
          <Box />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
