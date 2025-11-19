import  { useState } from "react";
import { Box, Button, Container, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import ShelfList from "./components/ShelfList";
import ShelfFormDialog from "./components/ShelfFormDialog";
import useShelfTypes from "./components/useShelfTypes";
import shelfApi from "@/api/shelfApi";
import type { ShelfType } from "./components/types";

export default function ShelfPage() {
  const { data, loading, error, reload, setData } = useShelfTypes();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ShelfType> | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const openCreate = () => {
    setEditing(undefined);
    setEditOpen(true);
  };

  const openEdit = (s: ShelfType) => {
    setEditing(s);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(undefined);
  };

  const onSaved = (saved: ShelfType) => {
    setData((prev) => {
      if (!prev) return [saved];
      const idx = prev.findIndex((p) => p.shelfTypeId === saved.shelfTypeId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    setSnack({ open: true, message: "Saved", severity: "success" });
  };

  const handleDelete = async (id: number) => {
    if (!confirmDeleteId) {
      setConfirmDeleteId(id);
      return;
    }

    setDeleteLoading(true);
    try {
      await shelfApi.deleteShelf(id);
      setData((prev) => prev?.filter((p) => p.shelfTypeId !== id) || []);
      setSnack({ open: true, message: "Deleted", severity: "success" });
      setConfirmDeleteId(null);
    } catch (err: any) {
      setSnack({
        open: true,
        message: err?.message || "Delete failed",
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h4">Shelf Types</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={openCreate}>
            Create Shelf Type
          </Button>
          <Button variant="outlined" onClick={reload}>
            Reload
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", height: 240 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Typography color="error">Error: {error}</Typography>}

      {data && (
        <ShelfList list={data} onEdit={openEdit} onDelete={(id) => handleDelete(id)} />
      )}

      <ShelfFormDialog open={editOpen} onClose={closeEdit} initial={editing} onSaved={onSaved} />

      {/* Confirm Delete */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete shelf #{confirmDeleteId}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleteLoading} onClick={() => setConfirmDeleteId(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteLoading}
            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Container>
  );
}
