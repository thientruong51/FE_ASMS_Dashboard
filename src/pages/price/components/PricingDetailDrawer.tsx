import React, { useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useTranslation } from "react-i18next";

import priceApi from "@/api/priceApi";
import priceI18nHelper from "@/utils/priceI18nHelper";
import PricingFormDialog from "./PricingFormDialog";

/* ================= TYPES ================= */

type Props = {
  item?: any | null;
  itemIsShipping?: boolean;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

/* ================= CONFIRM DELETE ================= */

function ConfirmDialog({
  open,
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("pricing");

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title ?? t("confirm")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message ?? t("deleteConfirmMsg")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t("actions.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : t("actions.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ================= MAIN ================= */

export default function PricingDetailDrawer({
  item: itemProp,
  itemIsShipping = false,
  open,
  onClose,
  onRefresh,
}: Props) {
  const { t, i18n } = useTranslation("pricing");

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const langShort = i18n.language.startsWith("en") ? "en" : "vi";
  const locale = langShort === "en" ? "en-US" : "vi-VN";

  /* ================= FETCH DETAIL (NEW) ================= */

  const fetchDetail = async () => {
    if (!itemProp) return;

    setLoading(true);
    try {
      if (!itemIsShipping && itemProp.pricingId) {
        const resp = await priceApi.getPricing(itemProp.pricingId);
        const raw = resp?.data ?? itemProp;

        const enriched = priceI18nHelper.enrichPricingItem(
          t,
          raw,
          locale,
          true,
          "pricing"
        );

        setItem(enriched);
      }

      if (itemIsShipping && itemProp.shippingRateId) {
        const resp = await priceApi.getShippingRate(itemProp.shippingRateId);
        const raw = resp?.data ?? itemProp;

        const enriched = priceI18nHelper.enrichShippingItem(
          t,
          raw,
          locale,
          true,
          "pricing"
        );

        setItem(enriched);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!open) return;
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemProp, itemIsShipping, locale]);

  /* ================= HEADER ================= */

  const header = useMemo(() => {
    if (!item)
      return itemIsShipping
        ? t("labels.shippingRate")
        : t("labels.pricing");

    if (itemIsShipping) {
      return `${t("labels.shippingRate")} #${item.shippingRateId}`;
    }

    return `${item.serviceType_t ?? item.serviceType} • ${
      item.itemCode_t ?? item.itemCode
    } (${item.pricingId})`;
  }, [item, itemIsShipping, t]);

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      if (itemIsShipping) {
        await priceApi.deleteShippingRate(item.shippingRateId);
      } else {
        await priceApi.deletePricing(item.pricingId);
      }
      onRefresh?.();
      onClose();
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 56, height: 56 }}>
                {itemIsShipping ? (
                  <LocalShippingIcon />
                ) : (
                  <StorefrontIcon />
                )}
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                  {header}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 13 }}
                >
                  {t("page.clickToView")}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Divider />

          {/* CONTENT */}
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    {!itemIsShipping && item && (
                      <>
                        <Row label={t("table.id")} value={item.pricingId} />
                        <Row label={t("table.serviceType")} value={item.serviceType_t} />
                        <Row label={t("table.itemCode")} value={item.itemCode_t} />
                        <Row label={t("table.ac")} value={item.hasAirConditioning_t} />
                        <Row
                          label={t("table.month")}
                          value={item[`pricePerMonth_display_${langShort}`]}
                        />
                        <Row
                          label={t("table.week")}
                          value={item[`pricePerWeek_display_${langShort}`]}
                        />
                        <Row
                          label={t("table.trip")}
                          value={item[`pricePerTrip_display_${langShort}`]}
                        />
                        <Row label={t("table.info")} value={item.additionalInfo_t} />
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* FOOTER */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1}>
              {!itemIsShipping && item && (
                <>
                  <Button variant="outlined" onClick={() => setEditOpen(true)}>
                    {t("actions.edit")}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmOpen(true)}
                  >
                    {t("actions.delete")}
                  </Button>
                </>
              )}
              <Button variant="outlined" onClick={onClose}>
                {t("actions.close")}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>

      {/* EDIT */}
      <PricingFormDialog
        open={editOpen}
        initialItem={!itemIsShipping ? item : null}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          onRefresh?.();   // reload list
          fetchDetail();   // reload drawer ✅
        }}
      />

      {/* DELETE */}
      <ConfirmDialog
        open={confirmOpen}
        loading={actionLoading}
        title={t("confirmDeleteTitle")}
        message={t("confirmDeletePricingMsg", { id: item?.pricingId })}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ================= ROW ================= */

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Box sx={{ width: 160, color: "text.secondary" }}>{label}</Box>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Box>
  );
}
