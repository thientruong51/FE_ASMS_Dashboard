import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, Alert } from "@mui/material";
import shelfApi from "@/api/shelfApi";
import type { ShelfType } from "./types";

export default function ShelfFormDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ShelfType>;
  onSaved: (s: ShelfType) => void;
}) {
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
    if (!f.name) errs.name = "Name is required";
    if (!f.length || f.length <= 0) errs.length = "Length must be > 0";
    if (!f.width || f.width <= 0) errs.width = "Width must be > 0";
    if (!f.height || f.height <= 0) errs.height = "Height must be > 0";
    if (f.price !== null && f.price !== undefined && f.price < 0) errs.price = "Price cannot be negative";
    if (f.imageUrl && !/^https?:\/\//i.test(f.imageUrl)) errs.imageUrl = "Must be a valid URL";

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
      setError("Please fix validation errors");
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
        imageUrl: form.imageUrl || "",
      };

      if (form.shelfTypeId) {
        const res = await shelfApi.updateShelf(form.shelfTypeId, payload);
        onSaved(res.data.data || { ...payload, shelfTypeId: form.shelfTypeId });
      } else {
        const res = await shelfApi.createShelf(payload);
        onSaved(res.data.data);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{form.shelfTypeId ? "Update Shelf Type" : "Create Shelf Type"}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Name"
            value={form.name || ""}
            onChange={handleChange("name")}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <TextField
              label="Length"
              value={form.length || ""}
              onChange={handleChange("length")}
              error={!!fieldErrors.length}
              helperText={fieldErrors.length}
            />
            <TextField
              label="Width"
              value={form.width || ""}
              onChange={handleChange("width")}
              error={!!fieldErrors.width}
              helperText={fieldErrors.width}
            />
            <TextField
              label="Height"
              value={form.height || ""}
              onChange={handleChange("height")}
              error={!!fieldErrors.height}
              helperText={fieldErrors.height}
            />
          </Box>

          <TextField
            label="Price"
            value={form.price ?? ""}
            onChange={handleChange("price")}
            error={!!fieldErrors.price}
            helperText={fieldErrors.price}
          />

          <TextField
            label="GLB URL"
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
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
