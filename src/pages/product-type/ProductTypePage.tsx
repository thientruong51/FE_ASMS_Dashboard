import { useEffect, useState } from "react";
import { Container, Box, Typography, Stack, Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ProductTypeList from "./components/ProductTypeList";
import ProductTypeDialog from "./components/ProductTypeDialog";
import { getProductTypes, type ProductTypeItem } from "@/api/productTypeApi";
import { useTranslation } from "react-i18next";

export default function ProductTypePage() {
  const { t } = useTranslation("productTypePage");

  const [rows, setRows] = useState<ProductTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [q] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = { pageNumber: 1, pageSize: 1000, name: q || undefined };
      const resp = await getProductTypes(params);
      setRows(resp.data ?? []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: t("loadFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tId = setTimeout(() => load(), 400);
    return () => clearTimeout(tId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openCreate = () => {
    setEditId(null);
    setDialogOpen(true);
  };
  const openEdit = (p: ProductTypeItem) => {
    setEditId(p.productTypeId);
    setDialogOpen(true);
  };

  const onSaved = () => {
    load();
    setSnack({ open: true, message: t("savedMessage"), severity: "success" });
  };

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
            boxShadow: "0 8px 30px rgba(18,52,86,0.04)",
          }}
        >
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))", zIndex: 1 }} />
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

        <Box width="100%">
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress aria-label={t("loadingAlt")} />
            </Box>
          ) : rows.length === 0 ? (
            <Typography color="text.secondary" align="center">
              {t("noResults")}
            </Typography>
          ) : (
            <ProductTypeList list={rows} onEdit={(p) => openEdit(p)} />
          )}
        </Box>
      </Stack>

      <ProductTypeDialog open={dialogOpen} productTypeId={editId ?? undefined} onClose={() => setDialogOpen(false)} onSaved={() => onSaved()} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
