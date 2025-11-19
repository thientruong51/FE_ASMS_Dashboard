import  { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Snackbar,
  Alert,
  Pagination as MuiPagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BuildingList from "./components/BuildingList";
import BuildingFormDialog from "./components/BuildingFormDialog";
import type { Building, Pagination as Pag } from "../building/components/types";
import * as api from "../../api/buildingApi";

import { useGLTF } from "@react-three/drei";

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

  async function fetchAll(p = page) {
    setLoading(true);
    try {
      const res = await api.getBuildings(p, pageSize);
      setList(res.data);
      setPagination(res.pagination ?? null);

      try {
        const urls = Array.from(
          new Set(
            res.data
              .map((b: any) => b.imageUrl)
              .filter(Boolean)
              .filter((u: string) => /\.(glb|gltf|obj)$/i.test(u))
          )
        );
        urls.forEach((u) => {
          try {
            useGLTF.preload?.(u);
          } catch {
          }
        });
      } catch {
      }
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Lấy danh sách building thất bại", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(page);
  }, [page]);

  function onOpenCreate() {
    setEditing(null);
    setOpenDialog(true);
  }
  function onOpenEdit(b: Building) {
    setEditing(b);
    setOpenDialog(true);
  }

  async function onSave(payload: Partial<Building>) {
    try {
      if (editing) {
        const updated = await api.updateBuilding(editing.buildingId, payload);
        setList((prev) => prev.map((b) => (b.buildingId === updated.buildingId ? updated : b)));
        setSnack({ open: true, message: "Cập nhật thành công", severity: "success" });
        setOpenDialog(false);
      } else {
        const created = await api.createBuilding(payload);

        if (page === 1) {
          setList((prev) => {
            const next = [created, ...prev];
            if (next.length > pageSize) next.pop();
            return next;
          });
        } else {
          setPage(1);
          setList((prev) => {
            const next = [created, ...prev];
            if (next.length > pageSize) next.pop();
            return next;
          });
        }

        setPagination((p) => (p ? { ...p, totalItems: (p.totalItems ?? 0) + 1 } : p));

        try {
          const u = (created as any).imageUrl;
          if (u && /\.(glb|gltf|obj)$/i.test(u)) {
            useGLTF.preload?.(u);
          }
        } catch {
        }

        setSnack({ open: true, message: "Tạo thành công", severity: "success" });
        setOpenDialog(false);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || "Lỗi khi lưu";
      setSnack({ open: true, message: msg, severity: "error" });
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Bạn có chắc muốn xóa building này?")) return;
    try {
      await api.deleteBuilding(id);
      setList((prev) => {
        const next = prev.filter((b) => b.buildingId !== id);

        if (next.length === 0 && page > 1) {
          const newPage = Math.max(1, page - 1);
          setPage(newPage);
          fetchAll(newPage);
        }

        return next;
      });

      setPagination((p) => (p ? { ...p, totalItems: Math.max(0, (p.totalItems ?? 1) - 1) } : p));
      setSnack({ open: true, message: "Xóa thành công", severity: "success" });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.response?.data?.message || "Xóa thất bại";
      setSnack({ open: true, message: msg, severity: "error" });
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <ApartmentIcon fontSize="large" />
          <Typography variant="h5">Building</Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenCreate}>
          Create Building
        </Button>
      </Box>

      <BuildingList list={list} onEdit={onOpenEdit} onDelete={onDelete} loading={loading} />

      {/* pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <MuiPagination count={pagination.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <BuildingFormDialog open={openDialog} initial={editing ?? undefined} onClose={() => setOpenDialog(false)} onSubmit={onSave} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
