// src/pages/components/PricingDetailDrawer.tsx
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
  Tooltip,
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

type Props = {
  item?: any | null;
  itemIsShipping?: boolean;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

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
        <DialogContentText>{message ?? t("deleteConfirmMsg")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t("actions.cancel") ?? "Cancel"}
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={16} /> : t("actions.confirm") ?? "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PricingDetailDrawer({ item: itemProp, itemIsShipping = false, open, onClose, onRefresh }: Props) {
  const { t, i18n } = useTranslation("pricing");
  const [item, setItem] = useState<any | null>(itemProp ?? null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setItem(itemProp ?? null);
  }, [itemProp]);

  useEffect(() => {
    if (!open) return;
    // if we only have summary and want to fetch full detail, attempt to fetch
    let mounted = true;
    (async () => {
      if (!itemProp) return;
      try {
        setLoading(true);
        if (itemIsShipping && itemProp.shippingRateId != null) {
          // priceApi.getShippingRate may return { success?, data? } or ShippingRateItem directly
          const resp = await priceApi.getShippingRate((itemProp as any).shippingRateId as number | string).catch((e) => {
            console.warn("[PricingDetailDrawer] getShippingRate error", e);
            return null;
          });
          // normalize possible wrapper
          const data = (resp as any)?.data ?? resp;
          if (mounted) setItem(data ?? itemProp);
        } else if (!itemIsShipping && itemProp.pricingId != null) {
          const resp = await priceApi.getPricing((itemProp as any).pricingId as number | string).catch((e) => {
            console.warn("[PricingDetailDrawer] getPricing error", e);
            return null;
          });
          const data = (resp as any)?.data ?? resp;
          if (mounted) setItem(data ?? itemProp);
        }
      } catch (err) {
        console.warn("Failed to fetch detail", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, itemProp, itemIsShipping]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  const langShort = (i18n.language ?? "vi").split("-")[0] || "vi";

  const currencyFromLocale = (n?: number | null) => {
    if (n == null) return "-";
    try {
      const locale = i18n.language === "en" ? "en-US" : "vi-VN";
      const symbol = i18n.language === "en" ? "VND" : "₫";
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n) + " " + symbol;
    } catch {
      return String(n);
    }
  };

  const header = useMemo(() => {
    if (!item) return itemIsShipping ? t("labels.shippingRate") : t("labels.pricing");
    if (itemIsShipping) return `${t("labels.shippingRate")} #${item.shippingRateId}`;
    return `${item.serviceType ?? ""} • ${item.itemCode ?? ""} (${item.pricingId ?? ""})`;
  }, [item, itemIsShipping, t]);

  const openConfirm = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

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
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>
              {itemIsShipping ? <LocalShippingIcon /> : <StorefrontIcon />}
            </Avatar>
            <Box>
              <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                {header}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                {t("page.clickToView") ?? (itemIsShipping ? "Shipping rate details" : "Pricing details")}
              </Typography>
            </Box>
          </Box>

          <Box>
            <IconButton onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Stack spacing={1}>
                    {itemIsShipping ? (
                      <>
                        {has(item?.shippingRateId) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.id")}</Box>
                            <Box sx={{ flex: 1 }}>{item.shippingRateId}</Box>
                          </Box>
                        )}
                        {has(item?.distanceRangeDisplay) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.distance")}</Box>
                            <Box sx={{ flex: 1 }}>{item.distanceRangeDisplay}</Box>
                          </Box>
                        )}
                        {has(item?.containerQtyDisplay) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.containerQty")}</Box>
                            <Box sx={{ flex: 1 }}>{item.containerQtyDisplay}</Box>
                          </Box>
                        )}
                        {has(item?.basePrice) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.basePrice")}</Box>
                            <Box sx={{ flex: 1 }}>{currencyFromLocale(item.basePrice)}</Box>
                          </Box>
                        )}
                        {has(item?.priceUnit) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.priceUnit")}</Box>
                            <Box sx={{ flex: 1 }}>{item.priceUnit}</Box>
                          </Box>
                        )}
                        {has(item?.specialItemSurcharge) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.specialSurcharge")}</Box>
                            <Box sx={{ flex: 1 }}>{item.specialItemSurcharge}</Box>
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        {has(item?.pricingId) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.id")}</Box>
                            <Box sx={{ flex: 1 }}>{item.pricingId}</Box>
                          </Box>
                        )}
                        {has(item?.serviceType) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.serviceType")}</Box>
                            <Box sx={{ flex: 1 }}>{item.serviceType_t ?? item.serviceType}</Box>
                          </Box>
                        )}
                        {has(item?.itemCode) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.itemCode")}</Box>
                            <Box sx={{ flex: 1 }}>{item.itemCode_t ?? item.itemCode}</Box>
                          </Box>
                        )}
                        {item?.hasAirConditioning !== undefined && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.ac")}</Box>
                            <Box sx={{ flex: 1 }}>{item.hasAirConditioning_t ?? (item.hasAirConditioning ? t("labels.yes") ?? "Yes" : t("labels.no") ?? "No")}</Box>
                          </Box>
                        )}
                        {has(item?.pricePerMonth) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.month")}</Box>
                            <Box sx={{ flex: 1 }}>
                              {item[`pricePerMonth_display_${langShort}`] ?? currencyFromLocale(item.pricePerMonth)}
                            </Box>
                          </Box>
                        )}
                        {has(item?.pricePerWeek) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.week")}</Box>
                            <Box sx={{ flex: 1 }}>
                              {item[`pricePerWeek_display_${langShort}`] ?? currencyFromLocale(item.pricePerWeek)}
                            </Box>
                          </Box>
                        )}
                        {has(item?.pricePerTrip) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.trip")}</Box>
                            <Box sx={{ flex: 1 }}>
                              {item[`pricePerTrip_display_${langShort}`] ?? currencyFromLocale(item.pricePerTrip)}
                            </Box>
                          </Box>
                        )}
                        {has(item?.additionalInfo) && (
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{t("table.info")}</Box>
                            <Box sx={{ flex: 1 }}>{item.additionalInfo_t ?? item.additionalInfo}</Box>
                          </Box>
                        )}
                      </>
                    )}

                    {/* other fields - show any remaining keys (skip those already shown) */}
                    {item &&
                      (() => {
                        const alreadyShown = new Set<string>([
                          // pricing keys
                          "pricingId",
                          "serviceType",
                          "serviceType_t",
                          "itemCode",
                          "itemCode_t",
                          "hasAirConditioning",
                          "hasAirConditioning_t",
                          "pricePerMonth",
                          "pricePerWeek",
                          "pricePerTrip",
                          `pricePerMonth_display_${langShort}`,
                          `pricePerWeek_display_${langShort}`,
                          `pricePerTrip_display_${langShort}`,
                          "additionalInfo",
                          "additionalInfo_t",
                          // shipping keys
                          "shippingRateId",
                          "distanceRangeDisplay",
                          "distanceRangeDisplay_t",
                          "containerQtyDisplay",
                          "containerQtyDisplay_t",
                          "basePrice",
                          `basePrice_display_${langShort}`,
                          "priceUnit",
                          "priceUnit_t",
                          "specialItemSurcharge",
                          // common meta
                          "createdDate",
                          "updatedDate",
                          "isActive",
                        ]);

                        return Object.keys(item)
                          .filter((k) => {
                            if (alreadyShown.has(k)) return false;
                            if (k.startsWith("__")) return false; // skip internal fields
                            // skip typical translated/display variants to avoid duplication
                            if (/_t$/.test(k) || /_vi$/.test(k) || /_en$/.test(k)) return false;
                            if (/display_/.test(k)) return false;
                            // skip empty
                            const v = item[k];
                            if (v === null || v === undefined || v === "") return false;
                            return true;
                          })
                          .map((k) => {
                            const v = item[k];
                            let display: React.ReactNode;
                            if (Array.isArray(v)) display = v.join(", ");
                            else if (typeof v === "object") {
                              try {
                                display = <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(v, null, 2)}</pre>;
                              } catch {
                                display = String(v);
                              }
                            } else if (typeof v === "number") {
                              // show numbers nicely (but not assume currency)
                              display = String(v);
                            } else {
                              display = String(v);
                            }

                            const label = k.replace(/([A-Z])/g, " $1").replace(/^_+/, "").replace(/_/g, " ");
                            return (
                              <Box key={k} sx={{ display: "flex", gap: 2 }}>
                                <Box sx={{ width: 160, color: "text.secondary", textTransform: "capitalize" }}>{label}</Box>
                                <Box sx={{ flex: 1 }}>{display}</Box>
                              </Box>
                            );
                          });
                      })()}
                  </Stack>
                </CardContent>
              </Card>

              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button variant="contained" size="small" onClick={() => { /* optionally implement edit */ }}>
                    {t("actions.edit") ?? "Edit"}
                  </Button>
                  <Button variant="outlined" size="small" color="error" onClick={openConfirm} disabled={actionLoading}>
                    {t("actions.delete") ?? "Delete"}
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose}>
            {t("actions.close") ?? "Close"}
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title={t("confirmDeleteTitle") ?? "Confirm delete"}
        message={
          itemIsShipping
            ? t("confirmDeleteShippingMsg", { id: item?.shippingRateId ?? "" }) ?? `Delete shipping rate ${item?.shippingRateId ?? ""}?`
            : t("confirmDeletePricingMsg", { id: item?.pricingId ?? "" }) ?? `Delete pricing ${item?.pricingId ?? ""}?`
        }
        loading={actionLoading}
        onCancel={() => {
          closeConfirm();
        }}
        onConfirm={handleDelete}
      />
    </Drawer>
  );
}
