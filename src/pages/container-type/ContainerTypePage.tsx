import  { useEffect, useState } from "react";
import { Box, Button, Container, Typography, Snackbar, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WidgetsIcon from "@mui/icons-material/Widgets";
import ContainerTypeList from "./components/ContainerTypeList";
import ContainerTypeFormDialog from "./components/ContainerTypeFormDialog";
import type { ContainerType } from "./components/types";
import * as api from "../../api/containerTypeApi"; 
import { useGLTF } from "@react-three/drei";

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

async function fetchAll() {
  setLoading(true);
  try {
    const data = await api.getContainerTypes();
    setList(Array.isArray(data) ? data : []); 

    try {
      const urls = Array.from(
        new Set(
          data
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
}

  useEffect(() => {
    fetchAll();
  }, []);

  function onOpenCreate() {
    setEditing(null);
    setOpenDialog(true);
  }
  function onOpenEdit(t: ContainerType) {
    setEditing(t);
    setOpenDialog(true);
  }

  async function onSave(payload: Partial<ContainerType>) {
    try {
      if (editing) {
        const updated = await api.updateContainerType(editing.containerTypeId, payload);
        setList((prev) => prev.map((p) => (p.containerTypeId === (updated as any).containerTypeId ? updated : p)));
        setSnack({ open: true, message: "Cập nhật thành công", severity: "success" });
        setOpenDialog(false);
      } else {
        const created = await api.createContainerType(payload);
        setList((prev) => [created, ...prev]);
        try {
          const u = (created as any).imageUrl;
          if (u && /\.(glb|gltf|obj)$/i.test(u)) {
            useGLTF.preload?.(u);
          }
        } catch {}
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
    if (!confirm("Bạn có chắc muốn xóa loại container này?")) return;
    try {
      await api.deleteContainerType(id);
      setList((prev) => prev.filter((p) => p.containerTypeId !== id));
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
          <WidgetsIcon fontSize="large" />
          <Typography variant="h5">Container Types</Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenCreate}>
          Create ContainerType
        </Button>
      </Box>

      <ContainerTypeList list={list} onEdit={onOpenEdit} onDelete={onDelete} loading={loading} />

      <ContainerTypeFormDialog open={openDialog} initial={editing ?? undefined} onClose={() => setOpenDialog(false)} onSubmit={onSave} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
