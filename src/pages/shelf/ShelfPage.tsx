import { Suspense, lazy, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ShelvesIcon from "@mui/icons-material/Shelves";
import useShelfTypes from "./components/useShelfTypes";
import type { ShelfType } from "./components/types";
import { useTranslation } from "react-i18next";

const UPLOADED_HEADER = "/mnt/data/aec7304b-8487-4b8d-acac-ec778f371e73.png";

const ShelfList = lazy(() => import("./components/ShelfList"));
const ShelfFormDialog = lazy(() => import("./components/ShelfFormDialog"));

export default function ShelfPage() {
  const { t } = useTranslation("shelfPage");

  const { data, loading, error, reload, setData } = useShelfTypes();

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Partial<ShelfType> | undefined>(undefined);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: undefined as number | undefined,
    name: undefined as string | undefined
  });

  const [deleting, setDeleting] = useState(false);

  const onOpenCreate = () => {
    setEditing(undefined);
    setOpenDialog(true);
  };

  const onOpenEdit = (s: ShelfType) => {
    setEditing(s);
    setOpenDialog(true);
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

    setSnack({ open: true, message: t("saved"), severity: "success" });
    setOpenDialog(false);
  };

  const onDeleteRequested = (id: number, name?: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, id: undefined, name: undefined });
  };

  const handleConfirmDelete = async () => {
    const id = deleteDialog.id;
    if (id == null) return handleCancelDelete();

    setDeleting(true);
    try {
      // optimistic update
      setData((prev) => prev?.filter((p) => p.shelfTypeId !== id) ?? []);
      setSnack({ open: true, message: t("deleted"), severity: "success" });

      handleCancelDelete();
      await reload();
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, message: err?.message || t("deleteFailed"), severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        {/* -------------------- HEADER -------------------- */}
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
                  <ShelvesIcon />
                </Avatar>

                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {t("title")}
                  </Typography>
                  <Typography color="text.secondary">{t("subtitle")}</Typography>
                </Box>
              </Box>

              <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenCreate}>
                {t("create")}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* -------------------- LIST SECTION -------------------- */}
        <Box width="100%">
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">
              {t("fetchFailed")}: {String(error)}
            </Typography>
          ) : (
            <Suspense
              fallback={
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <ShelfList list={data ?? []} onEdit={onOpenEdit} onDelete={(id) => onDeleteRequested(id)} />
            </Suspense>
          )}
        </Box>
      </Stack>

      {/* -------------------- FORM DIALOG (lazy) -------------------- */}
      <Suspense fallback={null}>
        <ShelfFormDialog
          open={openDialog}
          initial={editing}
          onClose={() => setOpenDialog(false)}
          onSaved={onSaved}
        />
      </Suspense>

      {/* -------------------- DELETE DIALOG -------------------- */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            minWidth: 380
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 0 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "rgba(244,67,54,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="26" height="26" fill="#f44336" viewBox="0 0 24 24">
              <path d="M11.001 10h2v5h-2zm0-4h2v2h-2z" />
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
            </svg>
          </Box>

          <Typography variant="h6" fontWeight={700}>
            {t("deleteConfirmTitle")}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ fontSize: 15, color: "text.secondary" }}>
            {deleteDialog.name
              ? t("deleteConfirmBody_single", { name: deleteDialog.name })
              : t("deleteConfirmBody_plural")}
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
          >
            {deleting ? <CircularProgress size={20} sx={{ color: "white" }} /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* -------------------- SNACKBAR -------------------- */}
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
