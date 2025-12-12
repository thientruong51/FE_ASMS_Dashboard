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
  CircularProgress
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DoorSlidingIcon from "@mui/icons-material/DoorSliding";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import DeleteIcon from "@mui/icons-material/Delete";

import type { StorageType } from "./components/types";
import * as api from "../../api/storageTypeApi";
import { useGLTF } from "@react-three/drei";
import { useTranslation } from "react-i18next";

const UPLOADED_HEADER = "/mnt/data/5c1c4b28-14bf-4a18-b70c-5acac3461e5e.png";

// ✅ Lazy load components
const StorageTypeList = lazy(() => import("./components/StorageTypeList"));
const StorageTypeFormDialog = lazy(() => import("./components/StorageTypeFormDialog"));

type CategoryKey = "noac" | "ac" | "warehouse";

function groupKeyFromName(name?: string): CategoryKey {
  const n = (name ?? "").toLowerCase();
  if (!n) return "noac";
  if (n.includes("warehouse") || n.includes("ware")) return "warehouse";
  if (n.includes("ac")) return "ac";
  return "noac";
}

export default function StorageTypePage() {
  const { t } = useTranslation("storageTypePage");

  const [list, setList] = useState<StorageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<StorageType | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const [category, setCategory] = useState<CategoryKey>("noac");

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: undefined as number | undefined,
    name: undefined as string | undefined
  });
  const [deleting, setDeleting] = useState(false);

  // ------------------------------------
  // FETCH DATA
  // ------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.getStorageTypes({ page: 1, pageSize: 100 });
      const data = Array.isArray(resp.data) ? resp.data : [];
      setList(data);

      // Fix TS: ensure string filter
      const urls = data
        .map((x) => x.imageUrl)
        .filter((u): u is string => typeof u === "string" && u.length > 0);

      urls.forEach((u) => {
        if (/\.(glb|gltf|obj)$/i.test(u)) {
          try {
            useGLTF.preload(u);
          } catch {}
        }
      });
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

  // ------------------------------------
  // GROUP LIST
  // ------------------------------------
  const groups = useMemo(() => {
    const byKey: Record<CategoryKey, StorageType[]> = { noac: [], ac: [], warehouse: [] };
    for (const s of list) {
      const k = groupKeyFromName(s.name);
      byKey[k].push(s);
    }
    (["noac", "ac", "warehouse"] as CategoryKey[]).forEach((k) => {
      byKey[k].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    });
    return byKey;
  }, [list]);

  const displayed = groups[category];

  // ------------------------------------
  // CRUD HANDLERS
  // ------------------------------------
  function openCreate() {
    setEditing(null);
    setOpenDialog(true);
  }

  function openEdit(s: StorageType) {
    setEditing(s);
    setOpenDialog(true);
  }

  async function handleSave(payload: Partial<StorageType>) {
    try {
      if (editing) {
        const updated = await api.updateStorageType(editing.storageTypeId, payload);
        setList((prev) =>
          prev.map((p) => (p.storageTypeId === updated.storageTypeId ? updated : p))
        );
        setSnack({
          open: true,
          message: t("saveSuccessUpdate"),
          severity: "success"
        });
      } else {
        const created = await api.createStorageType(payload);
        setList((prev) => [created, ...prev]);
        setSnack({
          open: true,
          message: t("saveSuccessCreate"),
          severity: "success"
        });
      }

      setOpenDialog(false);
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      setSnack({
        open: true,
        message: err?.message || t("saveFailed"),
        severity: "error"
      });
    }
  }

  function onDeleteRequested(id: number, name?: string) {
    setDeleteDialog({ open: true, id, name });
  }

  async function handleConfirmDelete() {
    const id = deleteDialog.id;
    if (!id) return handleCancelDelete();

    setDeleting(true);
    try {
      await api.deleteStorageType(id);
      setSnack({ open: true, message: t("deleteSuccess"), severity: "success" });
      setDeleteDialog({ open: false, id: undefined, name: undefined });
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      setSnack({
        open: true,
        message: err?.message || t("deleteFailed"),
        severity: "error"
      });
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setDeleteDialog({ open: false, id: undefined, name: undefined });
  }

  // ------------------------------------
  // RENDER
  // ------------------------------------
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
            minHeight: 140
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.06))`,
              zIndex: 1
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
              zIndex: 0
            }}
          />

          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 3, md: 4 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                  <WarehouseIcon />
                </Avatar>

                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {t("title")}
                  </Typography>
                  <Typography color="text.secondary">{t("subtitle")}</Typography>
                </Box>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                {t("create")}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* -------------------------------- CATEGORY TABS -------------------------------- */}
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, v) => v && setCategory(v)}
          sx={{ borderRadius: 10, bgcolor: "#fff", p: 1 }}
        >
          <ToggleButton value="noac" sx={{ px: 3 }}>
            <DoorSlidingIcon sx={{ mr: 1 }} />
            {t("roomNoAc")}
          </ToggleButton>

          <ToggleButton value="ac" sx={{ px: 3 }}>
            <AcUnitIcon sx={{ mr: 1 }} />
            {t("roomAc")}
          </ToggleButton>

          <ToggleButton value="warehouse" sx={{ px: 3 }}>
            <WarehouseIcon sx={{ mr: 1 }} />
            {t("warehouse")}
          </ToggleButton>
        </ToggleButtonGroup>

        <Box>
          <Chip label={t("countLabel", { count: displayed.length })} sx={{ mr: 1 }} />
          <Chip label={t("categoryLabel", { category })} />
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
            <StorageTypeList
              list={displayed}
              loading={loading}
              onEdit={openEdit}
              onDelete={(id) => onDeleteRequested(id)}
              selectable
              selectedId={selectedId ?? undefined}
              onSelect={(id) => setSelectedId(id)}
            />
          </Suspense>
        </Box>
      </Stack>

      {/* -------------------------------- FORM DIALOG (lazy) -------------------------------- */}
      <Suspense fallback={null}>
        <StorageTypeFormDialog
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
          sx: {
            borderRadius: 3,
            p: 1,
            minWidth: 360,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)"
          }
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
              justifyContent: "center"
            }}
          >
            <DeleteIcon sx={{ color: "error.main" }} />
          </Box>
          {t("deleteConfirmTitle")}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: 15 }}>
            {deleteDialog.name
              ? t("deleteConfirmSingle", { name: deleteDialog.name })
              : t("deleteConfirmPlural")}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelDelete} disabled={deleting} sx={{ textTransform: "none" }}>
            {t("cancel")}
          </Button>

          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ textTransform: "none" }}
            startIcon={deleting ? <CircularProgress size={18} /> : undefined}
          >
            {deleting ? t("deleting") : t("delete")}
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
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
