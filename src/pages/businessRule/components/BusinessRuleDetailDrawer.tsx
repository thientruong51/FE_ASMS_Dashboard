import  { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useTranslation } from "react-i18next";
import * as businessRulesApi from "@/api/businessRulesApi";

export type BusinessRuleItem = businessRulesApi.BusinessRuleItem;

type Props = {
  open: boolean;
  id?: number | null;
  item?: BusinessRuleItem | null | undefined;
  onClose: () => void;
  onSaved?: () => void;
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
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title ?? "Confirm"}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message ?? "Are you sure?"}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={16} /> : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BusinessRuleDetailDrawer({ open, id, item, onClose, onSaved }: Props) {
  const { t } = useTranslation("businessRules");

  const empty: BusinessRuleItem = {
    businessRuleId: undefined,
    ruleCode: "",
    category: "",
    ruleName: "",
    ruleDescription: "",
    ruleType: "",
    priority: "Medium",
    isActive: true,
    effectiveDate: null,
    expiryDate: null,
    createdDate: null,
    updatedDate: null,
    createdBy: null,
    updatedBy: null,
    notes: null,
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [form, setForm] = useState<BusinessRuleItem>(item ?? empty);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: "success" | "error" | "info"; message: string }>({
    open: false,
    severity: "info",
    message: "",
  });

  useEffect(() => {
    setForm(item ?? empty);
  }, [item, open]); 

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!open) return;
      if (!item && id) {
        setLoading(true);
        try {
          const resp = await businessRulesApi.getBusinessRule(id);
          if (!mounted) return;
          setForm(resp?.data ?? empty);
        } catch (err) {
          console.error("Failed to load rule", err);
          setSnackbar({ open: true, severity: "error", message: t("loadFailed") ?? "Load failed" });
        } finally {
          if (mounted) setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, item, open, t]);

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const setField = (k: keyof BusinessRuleItem, v: any) => setForm((s) => ({ ...(s ?? {}), [k]: v }));

  const validate = () => {
    if (!form.ruleCode || String(form.ruleCode).trim() === "") {
      setSnackbar({ open: true, severity: "error", message: t("ruleCodeRequired") ?? "Rule code is required" });
      return false;
    }
    if (!form.ruleName || String(form.ruleName).trim() === "") {
      setSnackbar({ open: true, severity: "error", message: t("ruleNameRequired") ?? "Rule name is required" });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (form.businessRuleId) {
        await businessRulesApi.updateBusinessRule(form.businessRuleId, form);
        setSnackbar({ open: true, severity: "success", message: t("updateSuccess") ?? "Updated" });
      } else {
        await businessRulesApi.createBusinessRule(form);
        setSnackbar({ open: true, severity: "success", message: t("createSuccess") ?? "Created" });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("save failed", err);
      setSnackbar({ open: true, severity: "error", message: t("saveFailed") ?? "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.businessRuleId) return;
    setConfirmLoading(true);
    try {
      await businessRulesApi.deleteBusinessRule(form.businessRuleId);
      setSnackbar({ open: true, severity: "success", message: t("deleteSuccess") ?? "Deleted" });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("delete failed", err);
      setSnackbar({ open: true, severity: "error", message: t("deleteFailed") ?? "Delete failed" });
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const priorities = ["Low", "Medium", "High", "Critical"];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 640, md: 700 } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                  {form?.businessRuleId ? `${form.ruleName ?? ""} (${form.businessRuleId})` : t("newRule")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {t("subtitle")}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton onClick={onClose} size="small">
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <TextField label={t("ruleCode")} value={form?.ruleCode ?? ""} onChange={(e) => setField("ruleCode", e.target.value)} size="small" fullWidth />
                    <TextField label={t("ruleName")} value={form?.ruleName ?? ""} onChange={(e) => setField("ruleName", e.target.value)} size="small" fullWidth />
                    <TextField label={t("category")} value={form?.category ?? ""} onChange={(e) => setField("category", e.target.value)} size="small" fullWidth />
                    <TextField
                      label={t("ruleDescription")}
                      value={form?.ruleDescription ?? ""}
                      onChange={(e) => setField("ruleDescription", e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      minRows={3}
                    />

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <TextField select label={t("ruleType")} value={form?.ruleType ?? ""} onChange={(e) => setField("ruleType", e.target.value)} size="small" sx={{ minWidth: 160 }}>
                        <MenuItem value="">—</MenuItem>
                        <MenuItem value="Business">Business</MenuItem>
                        <MenuItem value="Payment">Payment</MenuItem>
                        <MenuItem value="Operational">Operational</MenuItem>
                        <MenuItem value="Safety">Safety</MenuItem>
                      </TextField>

                      <TextField select label={t("priority")} value={form?.priority ?? "Medium"} onChange={(e) => setField("priority", e.target.value)} size="small" sx={{ minWidth: 160 }}>
                        {priorities.map((p) => (
                          <MenuItem key={p} value={p}>
                            {p}
                          </MenuItem>
                        ))}
                      </TextField>

                      <FormControlLabel control={<Switch checked={!!form?.isActive} onChange={(e) => setField("isActive", e.target.checked)} />} label={t("isActive")} sx={{ ml: "auto" }} />
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <DatePicker
                        label={t("effectiveDate")}
                        value={form?.effectiveDate ? new Date(form.effectiveDate) : null}
                        onChange={(d) => setField("effectiveDate", d ? d.toISOString() : null)}
                        slotProps={{ textField: { size: "small" } as any }}
                      />
                      <DatePicker
                        label={t("expiryDate")}
                        value={form?.expiryDate ? new Date(form.expiryDate) : null}
                        onChange={(d) => setField("expiryDate", d ? d.toISOString() : null)}
                        slotProps={{ textField: { size: "small" } as any }}
                      />
                    </Box>

                    <TextField label={t("notes")} value={form?.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} size="small" fullWidth multiline minRows={2} />
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              {form?.businessRuleId && (
                <Tooltip title={t("delete")}>
                  <Button color="error" variant="outlined" onClick={() => setConfirmOpen(true)} disabled={saving}>
                    {t("delete")}
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                {t("close")}
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? <CircularProgress size={16} /> : t("save")}
              </Button>
            </Box>
          </Box>
        </Box>

        <ConfirmDialog
          open={confirmOpen}
          title={t("deleteConfirmTitle")}
          message={t("deleteConfirmMessage")}
          loading={confirmLoading}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Drawer>
    </LocalizationProvider>
  );
}
