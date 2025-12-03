import  { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ServiceList from "./components/ServiceList";
import ServiceFormDialog from "./components/ServiceFormDialog";
import * as api from "../../api/serviceApi";
import { useTranslation } from "react-i18next";

export default function ServicePage() {
  const { t } = useTranslation("servicePage");

  const [list, setList] = useState<api.Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<api.Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const [category, setCategory] = useState<"addons" | "packages">("addons");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getServices();
      setList(data);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: t("fetchFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const groups = useMemo(() => {
    return {
      addons: list.filter((s) => s.serviceId >= 1 && s.serviceId <= 4),
      packages: list.filter((s) => s.serviceId >= 5)
    };
  }, [list]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(s: api.Service) {
    setEditing(s);
    setDialogOpen(true);
  }

  async function handleSave(payload: Partial<api.Service>) {
    try {
      if (editing) {
        const updated = await api.updateService(editing.serviceId, payload);
        setList((prev) => prev.map((p) => (p.serviceId === updated.serviceId ? updated : p)));
        setSnack({ open: true, message: t("updateSuccess"), severity: "success" });
      } else {
        const created = await api.createService(payload);
        setList((prev) => [created, ...prev]);
        setSnack({ open: true, message: t("createSuccess"), severity: "success" });
      }
      setDialogOpen(false);
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, message: err?.message || t("saveFailed"), severity: "error" });
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        <Box
          sx={{
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            minHeight: 120,
            boxShadow: "0 8px 30px rgba(18,52,86,0.04)"
          }}
        >
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))", zIndex: 1 }} />
          <Box sx={{ position: "absolute", right: 0, top: 0, bottom: 0, width: { xs: 120, md: 240 }, opacity: 0.12, zIndex: 0 }} />
          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 2, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {t("title")}
                </Typography>
                <Typography color="text.secondary">{t("subtitle")}</Typography>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                {t("create")}
              </Button>
            </Box>
          </Box>
        </Box>

        <ToggleButtonGroup value={category} exclusive onChange={(_, v) => v && setCategory(v)} sx={{ p: 1, borderRadius: 2, bgcolor: "#fff" }}>
          <ToggleButton value="addons" sx={{ px: 3 }}>
            <LocalShippingIcon sx={{ mr: 1 }} />
            {t("addonsLabel")}
          </ToggleButton>
          <ToggleButton value="packages" sx={{ px: 3 }}>
            <BusinessCenterIcon sx={{ mr: 1 }} />
            {t("packagesLabel")}
          </ToggleButton>
        </ToggleButtonGroup>

        <Box>
          <Chip label={t("countLabel", { count: groups[category].length })} sx={{ mr: 1 }} />
          <Chip label={t("categoryLabel", { category })} />
        </Box>

        <Box width="100%">
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={160}>
              <CircularProgress aria-label={t("loadingAlt")} />
            </Box>
          ) : (
            <ServiceList list={groups[category]} onEdit={openEdit} />
          )}
        </Box>
      </Stack>

      <ServiceFormDialog open={dialogOpen} initial={editing ?? undefined} onClose={() => setDialogOpen(false)} onSubmit={handleSave} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
