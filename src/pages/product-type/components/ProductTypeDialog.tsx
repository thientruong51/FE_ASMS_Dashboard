import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ProductTypeItem } from "@/api/productTypeApi";
import { createProductType, getProductType, updateProductType } from "@/api/productTypeApi";

type Props = {
  open: boolean;
  onClose: () => void;
  productTypeId?: number | null;
  onSaved?: (item: ProductTypeItem) => void;
};

export default function ProductTypeDialog({ open, onClose, productTypeId, onSaved }: Props) {
  const { t } = useTranslation("productTypePage");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<ProductTypeItem>>({
    name: "",
    description: "",
    isActive: true,
    isFragile: false,
    canStack: true,
  });

  useEffect(() => {
    if (!open) return;
    if (!productTypeId) {
      setForm({
        name: "",
        description: "",
        isActive: true,
        isFragile: false,
        canStack: true,
      });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await getProductType(productTypeId);
        if (!mounted) return;
        setForm(resp);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, productTypeId]);

  const handleChange = (k: keyof ProductTypeItem) => (e: any) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [k]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || form.name.trim() === "") return alert(t("name") + " " + "is required");
    try {
      setLoading(true);
      let saved;
      if (productTypeId) {
        saved = await updateProductType(productTypeId, form);
      } else {
        saved = await createProductType(form);
      }
      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{productTypeId ? t("editDialogTitle") : t("createDialogTitle")}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <TextField label={t("name")} value={form.name ?? ""} onChange={handleChange("name")} fullWidth required />
          <TextField label={t("description")} value={form.description ?? ""} onChange={handleChange("description")} fullWidth multiline rows={3} />
          <FormControlLabel control={<Checkbox checked={!!form.isFragile} onChange={handleChange("isFragile")} />} label={t("isFragileLabel")} />
          <FormControlLabel control={<Checkbox checked={!!form.canStack} onChange={handleChange("canStack")} />} label={t("canStackLabel")} />
          <FormControlLabel control={<Checkbox checked={!!form.isActive} onChange={handleChange("isActive")} />} label={t("isActiveLabel")} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
