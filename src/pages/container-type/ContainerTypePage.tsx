import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Snackbar,
  Alert,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DoorSlidingIcon from "@mui/icons-material/DoorSliding";
import WidgetsIcon from "@mui/icons-material/Widgets";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import DeleteIcon from "@mui/icons-material/Delete";

import type { ContainerType } from "./components/types";
import * as api from "../../api/containerTypeApi";
import { useGLTF } from "@react-three/drei";
import { useTranslation } from "react-i18next";

const UPLOADED_HEADER = "/mnt/data/5c1c4b28-14bf-4a18-b70c-5acac3461e5e.png";

const ContainerTypeList = lazy(() => import("./components/ContainerTypeList"));
const ContainerTypeFormDialog = lazy(() => import("./components/ContainerTypeFormDialog"));

type CategoryKey = "self" | "warehouse";

function groupKeyFromType(type?: string): CategoryKey {
  const t = (type ?? "").toLowerCase();
  if (t.includes("_storage")) return "self";
  return "warehouse";
}

export default function ContainerTypePage() {
  const { t } = useTranslation("containerType");

  const [list, setList] = useState<ContainerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ContainerType | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [category, setCategory] = useState<CategoryKey>("self");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getContainerTypes();
      const arr = Array.isArray(data) ? data : [];
      setList(arr);

      try {
        const urls = arr
          .map((b) => b.imageUrl)
          .filter((u): u is string => typeof u === "string" && u.length > 0)
          .filter((u) => /\.(glb|gltf|obj)$/i.test(u));

        urls.forEach((u) => {
          try {
            useGLTF.preload(u);
          } catch { }
        });
      } catch { }
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: t("messages.fetchFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const groups = useMemo(() => {
    const byKey: Record<CategoryKey, ContainerType[]> = { self: [], warehouse: [] };
    for (const item of list) {
      const k = groupKeyFromType(item.type);
      byKey[k].push(item);
    }

    (["self", "warehouse"] as CategoryKey[]).forEach((key) => {
      byKey[key].sort((a, b) => (a.type ?? "").localeCompare(b.type ?? ""));
    });

    return byKey;
  }, [list]);

  function openCreate() {
    setEditing(null);
    setOpenDialog(true);
  }

  function openEdit(item: ContainerType) {
    setEditing(item);
    setOpenDialog(true);
  }

  async function handleSave(payload: Partial<ContainerType>) {
    try {
      if (editing) {
        const updated = await api.updateContainerType(editing.containerTypeId, payload);
        setList((prev) =>
          prev.map((p) => (p.containerTypeId === (updated as any).containerTypeId ? updated : p))
        );
        setSnack({ open: true, message: t("messages.updateSuccess"), severity: "success" });
      } else {
        const created = await api.createContainerType(payload);
        setList((prev) => [created, ...prev]);
        setSnack({ open: true, message: t("messages.createSuccess"), severity: "success" });
      }

      setOpenDialog(false);
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || t("messages.saveFailed");
      setSnack({ open: true, message: msg, severity: "error" });
    }
  }

  function onDeleteRequested(id: number, name?: string) {
    setDeleteDialog({ open: true, id, name });
  }

  async function handleConfirmDelete() {
    const id = deleteDialog.id;
    if (!id) {
      setDeleteDialog({ open: false });
      return;
    }

    setDeleting(true);
    try {
      await api.deleteContainerType(id);
      setSnack({ open: true, message: t("messages.deleteSuccess"), severity: "success" });

      await fetchAll();
      setDeleteDialog({ open: false });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || t("messages.deleteFailed");
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setDeleteDialog({ open: false });
  }

  const displayed = groups[category];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        {/* -------------------------------- HEADER -------------------------------- */}
        <Box
          sx={{
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(18, 52, 86, 0.06)",
            position: "relative",
            minHeight: 140,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.06))`,
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: { xs: 120, md: 240 },
              backgroundImage: `url(${UPLOADED_HEADER})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.14,
              zIndex: 0,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 3, md: 4 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                  <WidgetsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {t("page.title")}
                  </Typography>
                  <Typography color="text.secondary">{t("page.subtitle")}</Typography>
                </Box>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                {t("page.create")}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* -------------------------------- TABS -------------------------------- */}
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, v) => v && setCategory(v)}
          sx={{ borderRadius: 10, bgcolor: "#fff", p: 1 }}
        >
          <ToggleButton value="self" sx={{ px: 3 }}>
            <DoorSlidingIcon sx={{ mr: 1 }} />
            {t("page.tabs.self")}
          </ToggleButton>

          <ToggleButton value="warehouse" sx={{ px: 3 }}>
            <WarehouseIcon sx={{ mr: 1 }} />
            {t("page.tabs.warehouse")}
          </ToggleButton>
        </ToggleButtonGroup>

        {/* -------------------------------- INFO CHIPS -------------------------------- */}
        <Box>
          <Chip label={t("page.count", { count: displayed.length })} sx={{ mr: 1 }} />
          <Chip label={t("page.category", { cat: category })} />
        </Box>

        {/* -------------------------------- LAZY LIST -------------------------------- */}
        <Box width="100%" minHeight={200}>
          <Suspense
            fallback={
              <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            }
          >
            <ContainerTypeList
              list={displayed}
              loading={loading}
              onEdit={openEdit}
              onDelete={(id) => onDeleteRequested(id)}
            />
          </Suspense>
        </Box>
      </Stack>

      {/* -------------------------------- LAZY FORM DIALOG -------------------------------- */}
      <Suspense fallback={null}>
        <ContainerTypeFormDialog
          open={openDialog}
          initial={editing ?? undefined}
          onClose={() => setOpenDialog(false)}
          onSubmit={handleSave}
        />
      </Suspense>

      {/* -------------------------------- DELETE DIALOG -------------------------------- */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: { borderRadius: 3, p: 1, minWidth: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "rgba(244,67,54,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DeleteIcon sx={{ color: "error.main" }} />
          </Box>
          {t("delete.title")}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: 15 }}>
            {deleteDialog.name
              ? t("delete.confirmWithName", { name: deleteDialog.name })
              : t("delete.confirm")}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelDelete} disabled={deleting} sx={{ textTransform: "none" }}>
            {t("delete.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ textTransform: "none" }}
            startIcon={deleting ? <CircularProgress size={18} /> : undefined}
          >
            {deleting ? t("delete.deleting") : t("delete.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* -------------------------------- SNACKBAR -------------------------------- */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
