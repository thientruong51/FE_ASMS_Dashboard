import React from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  useTheme,
} from "@mui/material";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { useTranslation } from "react-i18next";
import OrderDetailFullDialog from "./OrderDetailFullDialog"; 

export type InlineStorageDialogProps = {
  open: boolean;
  onClose: () => void;
  storageCode: string;
  details: any[]; 
  onOpenDetail?: (d: any) => void;
};

const InlineStorageDialog: React.FC<InlineStorageDialogProps> = ({
  open,
  onClose,
  storageCode,
  details = [],
  onOpenDetail,
}) => {
  const { t } = useTranslation(["storagePage", "orderPanel"]);
  const theme = useTheme();

  const [selectedDetail, setSelectedDetail] = React.useState<any | null>(null);
  const [openFullDetail, setOpenFullDetail] = React.useState(false);

  const renderOrderCard = (d: any, idx: number) => {
    const bg = idx % 2 === 0 ? "#e3f2fd" : "#ede7f6";

    const handleClick = () => {
      onOpenDetail?.(d);

      setSelectedDetail(d);
      setOpenFullDetail(true);
    };

    return (
      <Box
        key={`${d.orderDetailId ?? idx}-${idx}`}
        sx={{ width: "50%" }}
        onClick={handleClick}
        role={onOpenDetail ? "button" : undefined}
      >
        <Card
          sx={{
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            backgroundColor: bg,
            p: 1.3,
            cursor: "pointer",
            transition: "0.2s",
            "&:hover": { borderColor: theme.palette.primary.light, bgcolor: "#f9fbff" },
          }}
        >
          <Box display="flex" justifyContent="flex-end" mb={0.3}>
            <DragIndicatorOutlinedIcon
              sx={{ fontSize: 16, color: "text.secondary", opacity: 0.6 }}
            />
          </Box>

          <Typography
            fontWeight={600}
            fontSize={13}
            mb={0.4}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <LockOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            {d.containerCode
              ? `${t("orderPanel.containerLabel", { code: d.containerCode })}`
              : t("orderPanel.detailLabel", { id: d.orderDetailId ?? idx })}
          </Typography>

          <Box display="flex" gap={1} alignItems="center" mb={0.5}>
            <Box>
              <Typography fontSize={12} color="text.secondary">
                {t("orderPanel.orderPrefix")}: <strong>{d._orderCode ?? d.orderCode ?? "-"}</strong>
              </Typography>

              <Typography fontSize={12} color="text.secondary">
                {t("orderPanel.statusLabel")}:{" "}
                {d._orderStatusLabel ?? d._orderStatus ?? d.orderStatus ?? "-"}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography fontWeight={700} fontSize={16}>
            {storageCode}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t("orderPanel.showing", { count: details.length })}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, 
              gap: 1.2,
            }}
          >
            {Array.isArray(details) && details.length > 0 ? (
              details.map((d, i) => renderOrderCard(d, i))
            ) : (
              <Typography color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
                {t("orderPanel.noDetails")}
              </Typography>
            )}
          </Box>

        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t("common.close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Full order detail dialog (opened when user clicks a card) */}
      <OrderDetailFullDialog
        open={openFullDetail}
        data={selectedDetail}
        onClose={() => {
          setOpenFullDetail(false);
          setSelectedDetail(null);
        }}
      />
    </>
  );
};

export default InlineStorageDialog;
