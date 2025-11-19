import { useCallback, useEffect, useMemo, useState } from "react";
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
  Pagination as MuiPagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ApartmentIcon from "@mui/icons-material/Apartment";
import StorageIcon from "@mui/icons-material/Storage";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildingList from "./components/BuildingList";
import BuildingFormDialog from "./components/BuildingFormDialog";
import type { Building, Pagination as Pag } from "./components/types";
import * as api from "../../api/buildingApi";
import { useGLTF } from "@react-three/drei";

const UPLOADED_HEADER = "/mnt/data/5c1c4b28-14bf-4a18-b70c-5acac3461e5e.png";

type CategoryKey = "self" | "warehouse";

function groupKeyFromName(name?: string): CategoryKey {
  const n = (name ?? "").toLowerCase();
  if (!n) return "self";
  if (n.includes("warehouse") || n.includes("ware")) return "warehouse";
  if (n.includes("storage") || n.includes("self")) return "self";
  return "self";
}

export default function BuildingPage() {
  const [list, setList] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [category, setCategory] = useState<CategoryKey>("self");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false,
    id: undefined,
    name: undefined,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = await api.getBuildings(p, pageSize);
        setList(res.data ?? []);
        setPagination(res.pagination ?? null);

        try {
          const urls = Array.from(
            new Set(
              (res.data ?? [])
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
        setSnack({ open: true, message: "Failed to load buildings", severity: "error" });
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchAll(page);
  }, [fetchAll, page]);

  const groups = useMemo(() => {
    const byKey: Record<CategoryKey, Building[]> = { self: [], warehouse: [] };
    for (const b of list) {
      const k = groupKeyFromName(b.name);
      byKey[k].push(b);
    }
    (["self", "warehouse"] as CategoryKey[]).forEach((k) => {
      byKey[k].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    });
    return byKey;
  }, [list]);

  const displayed = groups[category];

  function openCreate() {
    setEditing(null);
    setOpenDialog(true);
  }
  function openEdit(b: Building) {
    setEditing(b);
    setOpenDialog(true);
  }

  async function onSave(payload: Partial<Building>) {
    try {
      if (editing) {
        await api.updateBuilding(editing.buildingId, payload);
        setSnack({ open: true, message: "Updated successfully", severity: "success" });
        setOpenDialog(false);
        await fetchAll(page);
      } else {
        await api.createBuilding(payload);
        setSnack({ open: true, message: "Created successfully", severity: "success" });
        setOpenDialog(false);
        setPage(1);
        await fetchAll(1);
      }
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
      setDeleteDialog({ open: false });
      return;
    }
    setDeleting(true);
    try {
      await api.deleteBuilding(id);
      setSnack({ open: true, message: "Deleted successfully", severity: "success" });

      const nextList = list.filter((b) => b.buildingId !== id);
      if (nextList.length === 0 && page > 1) {
        const newPage = Math.max(1, page - 1);
        setPage(newPage);
        await fetchAll(newPage);
      } else {
        await fetchAll(page);
      }

      setDeleteDialog({ open: false, id: undefined, name: undefined });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || "Delete failed";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setDeleteDialog({ open: false, id: undefined, name: undefined });
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={4} alignItems="center">
        {/* Header */}
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
          <Box sx={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.06))`, zIndex: 1 }} />
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
                  <ApartmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Buildings
                  </Typography>
                  <Typography color="text.secondary">Manage buildings — includes 3D preview</Typography>
                </Box>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Create Building
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <ToggleButtonGroup value={category} exclusive onChange={(_, v) => v && setCategory(v)} sx={{ borderRadius: 10, bgcolor: "#fff", p: 1 }}>
          <ToggleButton value="self" sx={{ px: 3 }}>
            <StorageIcon sx={{ mr: 1 }} />
            Self Storage
          </ToggleButton>

          <ToggleButton value="warehouse" sx={{ px: 3 }}>
            <WarehouseIcon sx={{ mr: 1 }} />
            Warehouse
          </ToggleButton>
        </ToggleButtonGroup>

        <Box>
          <Chip label={`Total: ${displayed.length}`} sx={{ mr: 1 }} />
          <Chip label={`Category: ${category}`} />
        </Box>

        <Box width="100%">
          <BuildingList list={displayed} onEdit={openEdit} onDelete={(id: number, name?: string) => onDeleteRequested(id, name)} loading={loading} />
        </Box>
      </Stack>

      {pagination && pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <MuiPagination count={pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <BuildingFormDialog open={openDialog} initial={editing ?? undefined} onClose={() => setOpenDialog(false)} onSubmit={onSave} />

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
          Delete Building
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: 15 }}>
            {deleteDialog.name ? (
              <>
                Are you sure you want to delete <strong>"{deleteDialog.name}"</strong>? This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to delete this building? This action cannot be undone."
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
