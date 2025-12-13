import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import priceApi, { type PricingItem } from "@/api/priceApi";

type Props = {
  open: boolean;
  onClose: () => void;
  initialItem?: PricingItem | null; // null = ADD, có = EDIT
  onSaved?: (item: PricingItem) => void;
};

const SERVICE_TYPES = [
  "RoomRental",
  "ShelfRental",
  "BoxSelfManaged",
  "BoxShared",
];

export default function PricingFormDialog({
  open,
  onClose,
  initialItem,
  onSaved,
}: Props) {
  const { t } = useTranslation("pricing");

  const isEdit = Boolean(initialItem?.pricingId);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PricingItem>>({
    serviceType: "",
    itemCode: "",
    hasAirConditioning: false,
    pricePerMonth: null,
    pricePerWeek: null,
    pricePerTrip: null,
    additionalInfo: "",
    isActive: true,
  });

  /* ---------- reset form ---------- */
  const resetForm = () => {
    setForm({
      serviceType: "",
      itemCode: "",
      hasAirConditioning: false,
      pricePerMonth: null,
      pricePerWeek: null,
      pricePerTrip: null,
      additionalInfo: "",
      isActive: true,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ---------- init form ---------- */
  useEffect(() => {
    if (!open) return;

    if (initialItem) {
      setForm({
        serviceType: initialItem.serviceType ?? "",
        itemCode: initialItem.itemCode ?? "",
        hasAirConditioning: initialItem.hasAirConditioning ?? false,
        pricePerMonth: initialItem.pricePerMonth ?? null,
        pricePerWeek: initialItem.pricePerWeek ?? null,
        pricePerTrip: initialItem.pricePerTrip ?? null,
        additionalInfo: initialItem.additionalInfo ?? "",
        isActive: initialItem.isActive ?? true,
      });
    } else {
      resetForm();
    }
  }, [open, initialItem]);

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      let resp;
      if (isEdit && initialItem?.pricingId) {
        resp = await priceApi.updatePricing(initialItem.pricingId, form);
      } else {
        resp = await priceApi.createPricing(form);
      }

      // luôn trigger reload + đóng dialog
      onSaved?.(resp?.data ?? (form as PricingItem));
      handleClose();
    } catch (e) {
      console.error("Save pricing failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (key: keyof PricingItem) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        e.target.type === "number"
          ? e.target.value === ""
            ? null
            : Number(e.target.value)
          : e.target.value;

      setForm((prev) => ({ ...prev, [key]: value }));
    };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t("actions.editPricing") : t("actions.addPricing")}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* Service Type */}
          <TextField
            select
            label={t("table.serviceType")}
            value={form.serviceType ?? ""}
            onChange={handleChange("serviceType")}
            fullWidth
            required
          >
            {SERVICE_TYPES.map((st) => (
              <MenuItem key={st} value={st}>
                {t(`serviceType.${st}`)}
              </MenuItem>
            ))}
          </TextField>

          {/* Item Code */}
          <TextField
            label={t("table.itemCode")}
            value={form.itemCode ?? ""}
            onChange={handleChange("itemCode")}
            fullWidth
            required
          />

          {/* AC */}
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(form.hasAirConditioning)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hasAirConditioning: e.target.checked,
                  }))
                }
              />
            }
            label={t("table.ac")}
          />

          {/* Prices */}
          <TextField
            type="number"
            label={t("table.month")}
            value={form.pricePerMonth ?? ""}
            onChange={handleChange("pricePerMonth")}
            fullWidth
          />

          <TextField
            type="number"
            label={t("table.week")}
            value={form.pricePerWeek ?? ""}
            onChange={handleChange("pricePerWeek")}
            fullWidth
          />

          <TextField
            type="number"
            label={t("table.trip")}
            value={form.pricePerTrip ?? ""}
            onChange={handleChange("pricePerTrip")}
            fullWidth
          />

          {/* Additional Info */}
          <TextField
            label={t("table.info")}
            value={form.additionalInfo ?? ""}
            onChange={handleChange("additionalInfo")}
            fullWidth
            multiline
            minRows={2}
          />

          {/* Active */}
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(form.isActive)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    isActive: e.target.checked,
                  }))
                }
              />
            }
            label={t("labels.active")}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t("actions.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={16} />
          ) : isEdit ? (
            t("actions.update")
          ) : (
            t("actions.create")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
