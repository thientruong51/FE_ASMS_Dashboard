import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, Alert } from "@mui/material";
import shelfTypeApi from "@/api/shelfTypeApi";
import type { ShelfType } from "./types";
import { useTranslation } from "react-i18next";

export default function ShelfFormDialog({
  open,
  onClose,
  initial,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ShelfType>;
  onSaved: (s: ShelfType) => void;
}) {
  const { t } = useTranslation("shelfPage");
  const [form, setForm] = useState<Partial<ShelfType>>(initial || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(initial || {});
    setError(null);
    setFieldErrors({});
  }, [initial, open]);

  const validate = (f: Partial<ShelfType>) => {
    const errs: Record<string, string> = {};
    if (!f.name) errs.name = `${t("name")} ${t("required")}`;
    if (!f.length || f.length <= 0) errs.length = t("lengthGT0");
    if (!f.width || f.width <= 0) errs.width = t("widthGT0");
    if (!f.height || f.height <= 0) errs.height = t("heightGT0");
    if (f.price !== null && f.price !== undefined && f.price < 0) errs.price = t("priceNonNegative");
    if (f.imageUrl && !/^https?:\/\//i.test(f.imageUrl)) errs.imageUrl = t("validUrl");

    return errs;
  };

  const handleChange = (key: keyof ShelfType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let value: any = raw;

    if (["length", "width", "height"].includes(key as string)) value = raw === "" ? undefined : parseFloat(raw);
    if (key === "price") value = raw === "" ? null : parseFloat(raw);

    setForm((s) => {
      const next = { ...s, [key]: value };
      setFieldErrors(validate(next));
      return next;
    });
  };

  const handleSave = async () => {
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError(t("saveFailed"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name!,
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        price: form.price === null ? null : Number(form.price),
        imageUrl: form.imageUrl || ""
      };

      if (form.shelfTypeId) {
        const res = await shelfTypeApi.updateShelf(form.shelfTypeId, payload);
        onSaved(res.data.data || { ...payload, shelfTypeId: form.shelfTypeId });
      } else {
        const res = await shelfTypeApi.createShelf(payload);
        onSaved(res.data.data);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{form.shelfTypeId ? t("editDialogTitle") : t("createDialogTitle")}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label={t("name")}
            value={form.name || ""}
            onChange={handleChange("name")}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <TextField
              label={t("length")}
              type="number"
              inputProps={{ step: "any" }}
              value={form.length ?? ""}
              onChange={handleChange("length")}
              error={!!fieldErrors.length}
              helperText={fieldErrors.length}
            />

            <TextField
              label={t("width")}
              type="number"
              inputProps={{ step: "any" }}
              value={form.width ?? ""}
              onChange={handleChange("width")}
              error={!!fieldErrors.width}
              helperText={fieldErrors.width}
            />

            <TextField
              label={t("height")}
              type="number"
              inputProps={{ step: "any" }}
              value={form.height ?? ""}
              onChange={handleChange("height")}
              error={!!fieldErrors.height}
              helperText={fieldErrors.height}
            />
          </Box>

          <TextField
            label={t("price")}
            value={form.price ?? ""}
            onChange={handleChange("price")}
            error={!!fieldErrors.price}
            helperText={fieldErrors.price}
          />

          <TextField
            label={t("glbUrl")}
            value={form.imageUrl || ""}
            onChange={handleChange("imageUrl")}
            error={!!fieldErrors.imageUrl}
            helperText={fieldErrors.imageUrl}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
