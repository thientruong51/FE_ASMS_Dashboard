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
  CircularProgress,
} from "@mui/material";
import type { EmployeeRoleItem } from "@/api/employeeRoleApi";
import {
  createEmployeeRole,
  getEmployeeRole,
  updateEmployeeRole,
} from "@/api/employeeRoleApi";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  employeeRoleId?: number | null;
  onSaved?: (item: EmployeeRoleItem) => void;
};

export default function EmployeeRoleDialog({
  open,
  onClose,
  employeeRoleId,
  onSaved,
}: Props) {
  const { t } = useTranslation("employeeRole");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeRoleItem>>({
    roleName: "",
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;

    if (!employeeRoleId) {
      setForm({ roleName: "", isActive: true });
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getEmployeeRole(employeeRoleId);
        if (mounted) setForm(data);
      } catch (err) {
        console.error(err);
        alert(t("messages.loadFailed"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, employeeRoleId, t]);

  const handleChange =
    (k: keyof EmployeeRoleItem) => (e: any) => {
      const value =
        e?.target?.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setForm((s) => ({ ...s, [k]: value }));
    };

  const handleSubmit = async () => {
    if (!form.roleName?.trim()) {
      alert(t("form.required"));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        roleName: form.roleName,
        isActive: form.isActive,
      };

      const saved = employeeRoleId
        ? await updateEmployeeRole(employeeRoleId, payload)
        : await createEmployeeRole(payload);

      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? t("messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {employeeRoleId
          ? t("form.editTitle")
          : t("form.createTitle")}
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <TextField
            label={t("form.name")}
            value={form.roleName ?? ""}
            onChange={handleChange("roleName")}
            fullWidth
            required
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={!!form.isActive}
                onChange={handleChange("isActive")}
                disabled={loading}
              />
            }
            label={t("form.active")}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("form.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={18} />
          ) : (
            t("form.save")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
