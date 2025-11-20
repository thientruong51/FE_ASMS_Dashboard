import  { useCallback, useEffect, useMemo, useState } from "react";
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
import ContainerTypeList from "./components/ContainerTypeList";
import ContainerTypeFormDialog from "./components/ContainerTypeFormDialog";
import type { ContainerType } from "./components/types";
import * as api from "../../api/containerTypeApi";
import { useGLTF } from "@react-three/drei";

const UPLOADED_HEADER = "/mnt/data/5c1c4b28-14bf-4a18-b70c-5acac3461e5e.png";

type CategoryKey = "self" | "warehouse";

function groupKeyFromType(type?: string): CategoryKey {
  const t = (type ?? "").toLowerCase();
  if (t.includes("_storage")) return "self";
  return "warehouse";
}

export default function ContainerTypePage() {
  const [list, setList] = useState<ContainerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ContainerType | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [category, setCategory] = useState<CategoryKey>("self");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false,
    id: undefined,
    name: undefined,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getContainerTypes();
      const arr = Array.isArray(data) ? data : [];
      setList(arr);

      try {
        const urls = Array.from(
          new Set(
            arr
              .map((b: any) => b.imageUrl)
              .filter(Boolean)
              .filter((u: string) => /\.(glb|gltf|obj)$/i.test(u))
          )
        );
        urls.forEach((u) => {
          try {
            useGLTF.preload?.(u);
          } catch {}
        });
      } catch {}
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Lấy danh sách thất bại", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const groups = useMemo(() => {
    const byKey: Record<CategoryKey, ContainerType[]> = { self: [], warehouse: [] };
    for (const t of list) {
      const k = groupKeyFromType(t.type);
      byKey[k].push(t);
    }
    (["self", "warehouse"] as CategoryKey[]).forEach((k) => {
      byKey[k].sort((a, b) => (a.type ?? "").localeCompare(b.type ?? ""));
    });
    return byKey;
  }, [list]);

  function openCreate() {
    setEditing(null);
    setOpenDialog(true);
  }
  function openEdit(t: ContainerType) {
    setEditing(t);
    setOpenDialog(true);
  }

  async function handleSave(payload: Partial<ContainerType>) {
    try {
      if (editing) {
        const updated = await api.updateContainerType(editing.containerTypeId, payload);
        setList((prev) => prev.map((p) => (p.containerTypeId === (updated as any).containerTypeId ? updated : p)));
        setSnack({ open: true, message: "Update successful", severity: "success" });
      } else {
        const created = await api.createContainerType(payload);
        setList((prev) => [created, ...prev]);
        setSnack({ open: true, message: "Create success", severity: "success" });
      }
      setOpenDialog(false);

      await fetchAll();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || "Error while saving";
      setSnack({ open: true, message: msg, severity: "error" });
    }
  }

  function onDeleteRequested(id: number, name?: string) {
    setDeleteDialog({ open: true, id, name });
  }

  async function handleConfirmDelete() {
    const id = deleteDialog.id;
    if (id == null) {
      setDeleteDialog({ open: false, id: undefined, name: undefined });
      return;
    }
    setDeleting(true);
    try {
      await api.deleteContainerType(id);
      setSnack({ open: true, message: "Delete successful", severity: "success" });

      await fetchAll();

      setDeleteDialog({ open: false, id: undefined, name: undefined });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || "Delete failure";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setDeleteDialog({ open: false, id: undefined, name: undefined });
  }

  const displayed = groups[category];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        {/* Header with subtle background image */}
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
                  <Typography variant="h5" fontWeight={800}>
                    Container Types
                  </Typography>
                  <Typography color="text.secondary">Manage container templates — 3D preview if available</Typography>
                </Box>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Create
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabs with icons */}
        <ToggleButtonGroup value={category} exclusive onChange={(_, v) => v && setCategory(v)} sx={{ borderRadius: 10, bgcolor: "#fff", p: 1 }}>
          <ToggleButton value="self" sx={{ px: 3 }}>
            <DoorSlidingIcon sx={{ mr: 1 }} />
            Self Storage
          </ToggleButton>

          <ToggleButton value="warehouse" sx={{ px: 3 }}>
            <WarehouseIcon sx={{ mr: 1 }} />
            Warehouse
          </ToggleButton>
        </ToggleButtonGroup>

        <Box>
          <Chip label={`Count: ${displayed.length}`} sx={{ mr: 1 }} />
          <Chip label={`Category: ${category}`} />
        </Box>

        {/* List */}
        <Box width="100%">
          {/* route delete to dialog */}
          <ContainerTypeList list={displayed} loading={loading} onEdit={openEdit} onDelete={(id: number, name?: string) => onDeleteRequested(id, name)} />
        </Box>
      </Stack>

      <ContainerTypeFormDialog open={openDialog} initial={editing ?? undefined} onClose={() => setOpenDialog(false)} onSubmit={handleSave} />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            minWidth: 360,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          },
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
          Delete Container Type
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: 15 }}>
            {deleteDialog.name ? (
              <>
                Are you sure you want to delete <strong>"{deleteDialog.name}"</strong>? This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to delete this container type? This action cannot be undone."
            )}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelDelete} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ textTransform: "none" }}
            startIcon={deleting ? <CircularProgress size={18} /> : undefined}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
