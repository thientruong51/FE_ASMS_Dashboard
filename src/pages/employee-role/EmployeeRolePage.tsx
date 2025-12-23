import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Stack,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  getEmployeeRoles,
  type EmployeeRoleItem,
} from "@/api/employeeRoleApi";
import EmployeeRoleDialog from "./components/EmployeeRoleDialog";
import { useTranslation } from "react-i18next";
import { translateRoleName } from "@/utils/roleNames";

export default function EmployeeRolePage() {
  const { t } = useTranslation("employeeRole");
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const [allRows, setAllRows] = useState<EmployeeRoleItem[]>([]);
  const [rows, setRows] = useState<EmployeeRoleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    message?: string;
    severity?: "success" | "error";
  }>({ open: false });

  const [q, setQ] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* =========================
     Helpers
  ========================== */

  const getRoleDisplayName = useCallback(
    (r: EmployeeRoleItem) =>
      translateRoleName(t, r.roleName),
    [t]
  );

  /* =========================
     Data
  ========================== */

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await getEmployeeRoles({ pageNumber: 1, pageSize: 1000 });
      const data = resp.data ?? [];
      setAllRows(data);
      setRows(data);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        message: t("messages.fetchFailed"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =========================
     Search + Filter (debounce)
  ========================== */

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const qLower = q.trim().toLowerCase();

      const filtered = allRows.filter((r) => {
        const matchesQ =
          !qLower ||
          r.roleName?.toLowerCase().includes(qLower) ||
          String(r.employeeRoleId).includes(qLower);

        const matchesActive =
          filterActive === ""
            ? true
            : filterActive === "active"
            ? !!r.isActive
            : !r.isActive;

        return matchesQ && matchesActive;
      });

      setRows(filtered);
    }, 260);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, filterActive, allRows]);

  /* =========================
     Actions
  ========================== */

  const openCreate = () => {
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (id: number) => {
    setEditId(id);
    setDialogOpen(true);
  };

  const onSaved = useCallback(() => {
    setDialogOpen(false);
    setEditId(null);
    fetchAll();
    setSnack({
      open: true,
      message: t("messages.saved"),
      severity: "success",
    });
  }, [fetchAll, t]);


  /* =========================
     Table columns
  ========================== */

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "employeeRoleId",
        headerName: t("table.id"),
        width: 100,
      },
      {
        field: "name",
        headerName: t("table.name"),
        flex: 1,
        minWidth: 240,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography fontWeight={600} sx={{ fontSize: { xs: 12, sm: 14 } }}>
              {getRoleDisplayName(params.row)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "isActive",
        headerName: t("table.active"),
        width: 120,
        renderCell: (params) => (
          <Chip
            label={
              params.value
                ? t("status.active")
                : t("status.inactive")
            }
            size="small"
            color={params.value ? "success" : "default"}
          />
        ),
      },
      {
        field: "actions",
        headerName: t("table.actions"),
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Box display="flex" gap={1}>
            <Box
              component="span"
              sx={{ cursor: "pointer" }}
              onClick={() => openEdit(params.row.employeeRoleId)}
            >
              <EditIcon fontSize="small" />
            </Box>
            
          </Box>
        ),
      },
    ],
    [t, getRoleDisplayName]
  );

  /* =========================
     Render
  ========================== */

  return (
    <Container maxWidth={false} sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        {/* hero */}
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
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 2, md: 3 } }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
              flexDirection={{ xs: "column", sm: "row" }}
            >
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {t("page.title")}
                </Typography>
                <Typography color="text.secondary">
                  {t("page.subtitle")}
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {t("page.create")}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* toolbar */}
        <Card sx={{ width: "100%", borderRadius: 2 }}>
          <CardContent>
            <Box
              display="flex"
              gap={2}
              flexDirection={{ xs: "column", sm: "row" }}
              width="30%"
            >
              <TextField
                placeholder={t("page.searchPlaceholder")}
                size="small"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                fullWidth
              />
              <TextField
                select
                label={t("page.filterAll")}
                size="small"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                sx={{ width: 150 }}
              >
                <MenuItem value="">{t("page.filterAll")}</MenuItem>
                <MenuItem value="active">{t("page.filterActive")}</MenuItem>
                <MenuItem value="inactive">{t("page.filterInactive")}</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {/* content */}
        <Card sx={{ width: "100%", borderRadius: 2 }}>
          <CardContent>
            {loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={200}
              >
                <CircularProgress />
              </Box>
            ) : isSmDown ? (
              <List>
                {rows.length === 0 ? (
                  <ListItem>
                    <ListItemText primary={t("page.noRolesFound")} />
                  </ListItem>
                ) : (
                  rows.map((r) => (
                    <ListItem
                      key={r.employeeRoleId}
                      secondaryAction={
                        <>
                          <IconButton onClick={() => openEdit(r.employeeRoleId)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          
                        </>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography fontWeight={700}>
                              {getRoleDisplayName(r)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Chip
                            label={
                              r.isActive
                                ? t("status.active")
                                : t("status.inactive")
                            }
                            size="small"
                            color={r.isActive ? "success" : "default"}
                          />
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            ) : (
              <DataGrid
                rows={rows.map((r) => ({ ...r, id: r.employeeRoleId }))}
                columns={columns}
                autoHeight
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f0f0",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "#f8f9fa",
                    borderBottom: "2px solid #e0e0e0",
                  },
                  "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader": {
                    fontSize: 13,
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </Stack>

      <EmployeeRoleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        employeeRoleId={editId ?? undefined}
        onSaved={onSaved}
      />

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
