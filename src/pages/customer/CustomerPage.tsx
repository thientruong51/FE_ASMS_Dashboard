// src/pages/CustomerPage.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Snackbar, Alert } from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";

import CustomerToolbar from "./components/CustomerToolbar";
import CustomerTable from "./components/CustomerTable";
import CustomerCardList from "./components/CustomerCardList";
import CustomerDialog from "./components/CustomerDialog";

import type { Customer } from "./components/customer.types";
import customerApi from "@/api/customerApi";
import CustomerForm from "./components/CustomerForm";
import { useTranslation } from "react-i18next";

export default function CustomerPage() {
  const { t } = useTranslation("customer");

  const [fullList, setFullList] = useState<Customer[]>([]);
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "true" | "false">("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const tmo = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(tmo);
  }, [searchTerm]);

  const fetchFullList = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await customerApi.getCustomers({ page: 1, pageSize: 1000 });
      const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
      setFullList(list);
      setRowCount(list.length);
      setPaginationModel((m) => ({ ...m, page: 0 }));
    } catch (err: any) {
      console.error("fetchFullList error", err);
      setSnack({ open: true, message: err?.response?.data?.message || t("messages.fetchFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFullList();
  }, [fetchFullList]);

  useEffect(() => {
    const applyFilters = (list: Customer[], q: string, status: "" | "true" | "false") => {
      let out = list.slice();
      if (q) {
        const low = q.toLowerCase();
        out = out.filter((c) =>
          (c.customerCode ?? "").toString().toLowerCase().includes(low) ||
          (c.name ?? "").toString().toLowerCase().includes(low) ||
          (c.email ?? "").toString().toLowerCase().includes(low) ||
          (c.phone ?? "").toString().toLowerCase().includes(low)
        );
      }
      if (status !== "") {
        const boolVal = status === "true";
        out = out.filter((c) => Boolean(c.isActive) === boolVal);
      }
      return out;
    };

    const filtered = applyFilters(fullList, debouncedSearch, filterStatus);
    const total = filtered.length;
    setRowCount(total);

    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    setRows(filtered.slice(start, end));
  }, [fullList, debouncedSearch, filterStatus, paginationModel]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = async (row: Customer) => {
    try {
      setLoading(true);
      const resp = await customerApi.getCustomerById(row.id);
      setEditingCustomer(resp.data);
      setDialogOpen(true);
    } catch (err: any) {
      console.error("load detail error", err);
      setSnack({ open: true, message: t("messages.loadDetailFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<Customer>) => {
    try {
      setLoading(true);
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, data);
        setSnack({ open: true, message: t("messages.updateSuccess"), severity: "success" });
      } else {
        await customerApi.createCustomer(data);
        setSnack({ open: true, message: t("messages.createSuccess"), severity: "success" });
      }
      setDialogOpen(false);
      await fetchFullList();
    } catch (err: any) {
      console.error("save error", err);
      setSnack({ open: true, message: err?.response?.data?.message || t("messages.saveFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm(t("dialog.deleteConfirm"))) return;
    try {
      setLoading(true);
      await customerApi.deleteCustomer(id);
      setSnack({ open: true, message: t("messages.deleteSuccess"), severity: "success" });
      await fetchFullList();
    } catch (err: any) {
      console.error("delete error", err);
      setSnack({ open: true, message: err?.response?.data?.message || t("messages.deleteFailed"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 20, sm: 28 } }}>
        {t("page.title")}
      </Typography>
      <Typography color="text.secondary" mb={2} sx={{ fontSize: { xs: 12, sm: 14 } }}>
        {t("page.subtitle")}
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
          <CustomerToolbar
            searchTerm={searchTerm}
            onSearchTermChange={(v) => {
              setSearchTerm(v);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
            filterStatus={filterStatus}
            onFilterStatusChange={(v) => {
              setFilterStatus(v);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
            onAdd={handleOpenAdd}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {loading ? (
            <CircularProgress sx={{ display: "block", mx: "auto", my: 6 }} />
          ) : (
            <>
              <CustomerTable
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />

              <CustomerCardList
                rows={rows}
                paginationModel={paginationModel}
                onPageChange={(newModel) => setPaginationModel(newModel)}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CustomerDialog open={dialogOpen} title={editingCustomer ? t("form.titleEdit") : t("form.titleAdd")} onClose={() => setDialogOpen(false)}>
        <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setDialogOpen(false)} />
      </CustomerDialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
