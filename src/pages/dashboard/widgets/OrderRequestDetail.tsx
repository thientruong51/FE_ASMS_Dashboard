import {
  Box,
  Typography,
  Divider,
  Avatar,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useState } from "react";

type Props = {
  data: any;
  onClose: () => void;
};

export default function OrderRequestDetail({ data, onClose }: Props) {
  const [viewMode, setViewMode] = useState<"order" | "customer">("order");

  if (!data) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* ===== HEADER ===== */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Box>
            <Typography fontWeight={600} fontSize={15}>
              Order Request Details
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 13 }}
            >
              {viewMode === "order" ? "Order Details" : "Customer Details"}
            </Typography>
          </Box>
        </Box>

        {/* Right side icons */}
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="View Customer">
            <IconButton
              size="small"
              color={viewMode === "customer" ? "primary" : "default"}
              onClick={() => setViewMode("customer")}
            >
              <PersonOutlineRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="View Order">
            <IconButton
              size="small"
              color={viewMode === "order" ? "primary" : "default"}
              onClick={() => setViewMode("order")}
            >
              <ReceiptLongRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* ===== CUSTOMER HEADER ===== */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{
              width: 46,
              height: 46,
              bgcolor: "#e3f2fd",
              color: "#1976d2",
              fontWeight: 600,
            }}
          >
            RI
          </Avatar>
          <Box>
            <Typography fontWeight={600}>{data.customer}</Typography>
            <Typography variant="body2" color="text.secondary">
              Manufacturing • Ludhiana, Punjab
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Reject
          </Button>
        </Box>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: 13, textAlign: "right", mb: 2 }}
      >
        {data.date}
      </Typography>

      {/* ===== BODY: SWITCH VIEW ===== */}
      {viewMode === "order" ? (
        <Box>
          <Typography fontWeight={600} mb={1}>
            Order Details
          </Typography>

          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              bgcolor: "#fff",
            }}
          >
            <Typography fontSize={14} fontWeight={600}>
              Order ID
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data.id}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Order Placed On
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data.date}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Description
            </Typography>
            <Typography variant="body2" mb={1.5}>
              Raj Industries is one of the leading FMCG companies in northern
              India dealing in Personal and Home Care products.
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Pickup Address
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data.location}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Delivery Address
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data.destination}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Route
            </Typography>
            <Typography variant="body2">Mumbai → Delhi</Typography>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography fontWeight={600} mb={1}>
            Customer Details
          </Typography>

          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 2,
              bgcolor: "#fff",
            }}
          >
            <Typography fontSize={14} fontWeight={600}>
              Customer Name
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data.customer}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Company
            </Typography>
            <Typography variant="body2" mb={1.5}>
              Raj Industries Pvt. Ltd
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Email
            </Typography>
            <Typography variant="body2" mb={1.5}>
              rajindustries@mail.com
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Phone
            </Typography>
            <Typography variant="body2" mb={1.5}>
              +91 98210 54321
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Address
            </Typography>
            <Typography variant="body2" mb={1.5}>
              Village Pawa, GT Road, Near Civil Airport, Ludhiana, Punjab,
              141120, IN
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
