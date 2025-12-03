import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Service } from "@/api/serviceApi";

export default function ServiceFormDialog({
  open,
  initial,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial?: Service | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Service>) => Promise<void> | void;
}) {
  const { t } = useTranslation("servicePage");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setPrice(initial.price ? String(initial.price) : "");
      setDescription(initial.description ?? "");
    } else {
      setName("");
      setPrice("");
      setDescription("");
    }
  }, [initial, open]);

  async function handleSave() {
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: Number(parseFloat(price) || 0),
        description: description || undefined
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? t("editDialogTitle") : t("createDialogTitle")}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label={t("name")} value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label={t("price")} value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
          <TextField
            label={t("description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
