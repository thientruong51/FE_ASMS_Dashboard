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
import type { EmployeeRoleItem } from "@/api/employeeRoleApi";
import { createEmployeeRole, getEmployeeRole, updateEmployeeRole } from "@/api/employeeRoleApi";

type Props = {
  open: boolean;
  onClose: () => void;
  employeeRoleId?: number | null;
  onSaved?: (item: EmployeeRoleItem) => void;
};

export default function EmployeeRoleDialog({ open, onClose, employeeRoleId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeRoleItem>>({
    name: "",
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    if (!employeeRoleId) {
      setForm({ name: "", isActive: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await getEmployeeRole(employeeRoleId);
        if (!mounted) return;
        setForm(resp);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, employeeRoleId]);

  const handleChange = (k: keyof EmployeeRoleItem) => (e: any) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [k]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || form.name.trim() === "") {
      alert("Tên vai trò là bắt buộc");
      return;
    }
    try {
      setLoading(true);
      let saved: EmployeeRoleItem;
      if (employeeRoleId) {
        saved = await updateEmployeeRole(employeeRoleId, form);
      } else {
        saved = await createEmployeeRole(form);
      }
      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Lưu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{employeeRoleId ? "Edit Employee Role" : "Create Employee Role"}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <TextField label="Name" value={form.name ?? ""} onChange={handleChange("name")} fullWidth required />
          <FormControlLabel
            control={<Checkbox checked={!!form.isActive} onChange={handleChange("isActive")} />}
            label="Active"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </DialogActions>
    </Dialog>
  );
}
