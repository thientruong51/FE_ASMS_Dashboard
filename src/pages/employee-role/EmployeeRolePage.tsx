import  { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  getEmployeeRoles,
  deleteEmployeeRole,
  type EmployeeRoleItem,
} from "@/api/employeeRoleApi";
import EmployeeRoleDialog from "./components/EmployeeRoleDialog";



export default function EmployeeRolePage() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const [allRows, setAllRows] = useState<EmployeeRoleItem[]>([]);
  const [rows, setRows] = useState<EmployeeRoleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({ open: false });

  const [q, setQ] = useState("");
  const [filterActive, setFilterActive] = useState<string>(""); 

  const debounceRef = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await getEmployeeRoles({ pageNumber: 1, pageSize: 1000 });
      const data = resp.data ?? [];
      setAllRows(data);
      setRows(data);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Load failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const qLower = q.trim().toLowerCase();
      const filtered = allRows.filter((r) => {
        const matchesQ =
          !qLower ||
          (r.name && r.name.toLowerCase().includes(qLower)) ||
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
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, filterActive, allRows]);

  const openCreate = () => {
    setEditId(null);
    setDialogOpen(true);
  };
  const openEdit = (id: number) => {
    setEditId(id);
    setDialogOpen(true);
  };

  const onSaved = () => {
    setDialogOpen(false);
    setEditId(null);
    fetchAll();
    setSnack({ open: true, message: "Saved", severity: "success" });
  };

  const handleDelete = async (id?: number | null) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteEmployeeRole(id);
      setAllRows((prev) => prev.filter((r) => r.employeeRoleId !== id));
      setRows((prev) => prev.filter((r) => r.employeeRoleId !== id));
      setSnack({ open: true, message: "Deleted", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "employeeRoleId", headerName: "ID", width: 100 },
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 240,
        renderCell: (params) => (
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography fontWeight={600} sx={{ fontSize: { xs: 12, sm: 14 } }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 120,
        renderCell: (params) => <Chip label={params.value ? "Active" : "Inactive"} size="small" color={params.value ? "success" : "default"} />,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Box display="flex" gap={1}>
            <Box component="span" sx={{ cursor: "pointer" }} onClick={() => openEdit(params.row.employeeRoleId)}>
              <EditIcon fontSize="small" />
            </Box>
            <Box component="span" sx={{ cursor: "pointer" }} onClick={() => handleDelete(params.row.employeeRoleId)}>
              <DeleteIcon fontSize="small" color="error" />
            </Box>
          </Box>
        ),
      },
    ],
    []
  );

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
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))", zIndex: 1 }} />
          <Box
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: { xs: 100, md: 240 },
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.12,
              zIndex: 0,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 2, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexDirection={{ xs: "column", sm: "row" }}>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Employee Roles
                </Typography>
                <Typography color="text.secondary">Manage employee roles</Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "stretch", sm: "flex-end" } }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  Create
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* toolbar card */}
        <Card sx={{ width: "100%", borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} flexDirection={{ xs: "column", sm: "row" }} alignItems="center" width="30%">
              <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: 0 }}>
                <TextField
                  placeholder="Search by name or id..."
                  size="small"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  fullWidth
                />
              </Box>

              <Box sx={{ width: { xs: "100%", sm: 150 } }}>
                <TextField
                  select
                  label="Filter active"
                  size="small"
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* content */}
        <Box width="100%">
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ width: "100%" }}>
                  {isSmDown ? (
                    <List>
                      {rows.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="No roles found" />
                        </ListItem>
                      ) : (
                        rows.map((r) => (
                          <ListItem
                            key={r.employeeRoleId}
                            secondaryAction={
                              <Box>
                                <IconButton edge="end" aria-label="edit" onClick={() => openEdit(r.employeeRoleId)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(r.employeeRoleId)}>
                                  <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                  <Typography fontWeight={700}>{r.name}</Typography>
                                </Box>
                              }
                              secondary={<>{r.isActive ? <Chip label="Active" size="small" color="success" /> : <Chip label="Inactive" size="small" />} </>}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  ) : (
                    <DataGrid
                      rows={rows.map((r) => ({ id: r.employeeRoleId, ...r }))}
                      columns={columns}
                      autoHeight
                      pageSizeOptions={[5, 10, 25]}
                      pagination
                      paginationMode="client"
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      disableRowSelectionOnClick
                      sx={{
                        border: "none",
                        "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
                        "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8f9fa", borderBottom: "2px solid #e0e0e0" },
                        "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader": { fontSize: 13 },
                      }}
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <EmployeeRoleDialog open={dialogOpen} onClose={() => setDialogOpen(false)} employeeRoleId={editId ?? undefined} onSaved={() => onSaved()} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Container>
  );
}


