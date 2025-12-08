import  { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { createContainer, updateContainer, type ContainerItem } from "@/api/containerApi";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  initial?: Partial<ContainerItem> | null;
  mode?: "create" | "edit";
  onClose: () => void;
  onSaved?: (item?: ContainerItem) => void;
};

export default function ContainerFormDialog({ open, initial = null, mode = "create", onClose, onSaved }: Props) {
  const { t } = useTranslation("container");
  const [form, setForm] = useState<Partial<ContainerItem>>(initial ?? {});
  const [loading, setLoading] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    setForm(initial ?? {});
  }, [initial, open]);

  const handleChange = (k: keyof ContainerItem, v: any) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === "create") {
        if (!form.containerCode || String(form.containerCode).trim() === "") {
          setSnackMsg(t("errors.missingCode") ?? "Container code is required");
          setSnackSeverity("error");
          setSnackOpen(true);
          return;
        }
        const created = await createContainer(form);
        setSnackMsg(t("messages.created") ?? "Created");
        setSnackSeverity("success");
        setSnackOpen(true);
        onSaved?.(created ?? undefined);
        onClose();
      } else {
        if (!form.containerCode) {
          setSnackMsg(t("errors.missingCode") ?? "Container code is required");
          setSnackSeverity("error");
          setSnackOpen(true);
          return;
        }
        const updated = await updateContainer(String(form.containerCode), form);
        setSnackMsg(t("messages.updated") ?? "Updated");
        setSnackSeverity("success");
        setSnackOpen(true);
        onSaved?.(updated ?? undefined);
        onClose();
      }
    } catch (err: any) {
      console.error("save container failed", err);
      const msg = err?.response?.data?.message ?? err?.message ?? (t("errors.unknown") ?? "Operation failed");
      setSnackMsg(msg);
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
        <DialogTitle>{mode === "create" ? t("dialog.createTitle") ?? "New container" : t("dialog.editTitle") ?? "Edit container"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("fields.containerCode") ?? "Code"}
              value={form.containerCode ?? ""}
              onChange={(e) => handleChange("containerCode", e.target.value)}
              fullWidth
              disabled={mode === "edit"}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("fields.floorCode") ?? "Floor"}
                value={form.floorCode ?? ""}
                onChange={(e) => handleChange("floorCode", e.target.value)}
                fullWidth
              />
              <TextField
                label={t("fields.type") ?? "Type"}
                value={form.type ?? ""}
                onChange={(e) => handleChange("type", e.target.value)}
                sx={{ width: 160 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("fields.serialNumber") ?? "Serial"}
                value={form.serialNumber ?? ""}
                onChange={(e) =>
                  handleChange(
                    "serialNumber",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                type="number"
                sx={{ width: 160 }}
              />
              <TextField
                label={t("fields.layer") ?? "Layer"}
                value={form.layer ?? ""}
                onChange={(e) =>
                  handleChange(
                    "layer",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                type="number"
                sx={{ width: 160 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("fields.maxWeight") ?? "Max weight"}
                value={form.maxWeight ?? ""}
                onChange={(e) =>
                  handleChange(
                    "maxWeight",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                type="number"
                sx={{ width: 160 }}
              />
              <TextField
                label={t("fields.currentWeight") ?? "Current weight"}
                value={form.currentWeight ?? ""}
                onChange={(e) =>
                  handleChange(
                    "currentWeight",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                type="number"
                sx={{ width: 160 }}
              />
            </Box>

            <TextField
              label={t("fields.notes") ?? "Notes"}
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive !== false}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                />
              }
              label={t("fields.isActive") ?? "Active"}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t("actions.cancel") ?? "Cancel"}
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {mode === "create" ? t("actions.create") ?? "Create" : t("actions.save") ?? "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
