import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { useState, useEffect } from "react";
import StaffForm from "./components/StaffForm";

// Type definitions based on Employee entity
export interface Employee {
  id: number;
  employeeCode: string;
  employeeRoleId?: number;
  name?: string;
  buildingId?: number;
  phone?: string;
  address?: string;
  username?: string;
  password?: string;
  status?: string;
  isActive: boolean;
  // Relations
  employeeRole?: {
    employeeRoleId: number;
    name?: string;
  };
  building?: {
    buildingId: number;
    name?: string;
  };
}

export interface EmployeeRole {
  employeeRoleId: number;
  name?: string;
  isActive?: boolean;
}

export interface Building {
  buildingId: number;
  name?: string;
}

export default function StaffPage() {
  // ===== STATE =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<string | "">("");


  useEffect(() => {
    setRoles([
      { employeeRoleId: 1, name: "Manager", isActive: true },
      { employeeRoleId: 2, name: "Warehouse Staff", isActive: true },
      { employeeRoleId: 3, name: "Delivery Staff", isActive: true },
      { employeeRoleId: 4, name: "Admin", isActive: true },
    ]);

    setBuildings([
      { buildingId: 1, name: "Building A" },
      { buildingId: 2, name: "Building B" },
      { buildingId: 3, name: "Building C" },
    ]);

    setEmployees([
      {
        id: 1,
        employeeCode: "EMP001",
        name: "Harsh Vani",
        employeeRoleId: 1,
        buildingId: 1,
        phone: "0901234567",
        address: "123 Street, City",
        username: "harsh.vani",
        status: "Active",
        isActive: true,
        employeeRole: { employeeRoleId: 1, name: "Manager" },
        building: { buildingId: 1, name: "Building A" },
      },
      {
        id: 2,
        employeeCode: "EMP002",
        name: "John Doe",
        employeeRoleId: 2,
        buildingId: 1,
        phone: "0902345678",
        address: "456 Avenue, City",
        username: "john.doe",
        status: "Active",
        isActive: true,
        employeeRole: { employeeRoleId: 2, name: "Warehouse Staff" },
        building: { buildingId: 1, name: "Building A" },
      },
      {
        id: 3,
        employeeCode: "EMP003",
        name: "Jane Smith",
        employeeRoleId: 3,
        buildingId: 2,
        phone: "0903456789",
        address: "789 Road, City",
        username: "jane.smith",
        status: "Inactive",
        isActive: false,
        employeeRole: { employeeRoleId: 3, name: "Delivery Staff" },
        building: { buildingId: 2, name: "Building B" },
      },
    ]);
  }, []);

  // ===== HANDLERS =====
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleSave = (data: Partial<Employee>) => {
    if (editingEmployee) {
      // Update
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id
            ? {
                ...emp,
                ...data,
                employeeRole: roles.find((r) => r.employeeRoleId === data.employeeRoleId),
                building: buildings.find((b) => b.buildingId === data.buildingId),
              }
            : emp
        )
      );
    } else {
      // Create
      const newEmployee: Employee = {
        id: employees.length + 1,
        employeeCode: data.employeeCode || `EMP${String(employees.length + 1).padStart(3, "0")}`,
        name: data.name,
        employeeRoleId: data.employeeRoleId,
        buildingId: data.buildingId,
        phone: data.phone,
        address: data.address,
        username: data.username,
        password: data.password,
        status: data.status || "Active",
        isActive: data.isActive ?? true,
        employeeRole: roles.find((r) => r.employeeRoleId === data.employeeRoleId),
        building: buildings.find((b) => b.buildingId === data.buildingId),
      };
      setEmployees((prev) => [...prev, newEmployee]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    }
  };

  // ===== FILTERING =====
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm);

    const matchesRole = filterRole === "" || emp.employeeRoleId === filterRole;
    const matchesStatus = filterStatus === "" || emp.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ===== DATA GRID COLUMNS =====
  const columns: GridColDef[] = [
    {
      field: "employeeCode",
      headerName: "Employee Code",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography fontWeight={600} fontSize={14}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Full Name",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={14} >{params.value || "-"}</Typography>
      ),
    },
    {
      field: "employeeRole",
      headerName: "Role",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value?.name || "N/A"}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: "building",
      headerName: "Building",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={14}>{params.value?.name || "-"}</Typography>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={13}>{params.value || "-"}</Typography>
      ),
    },
    {
      field: "username",
      headerName: "Username",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={13} fontFamily="monospace">
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params: GridRenderCellParams) => {
        const isActive = params.row.isActive;
        return (
          <Chip
            label={isActive ? "Active" : "Inactive"}
            size="small"
            color={isActive ? "success" : "default"}
            sx={{ fontWeight: 500 }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenEdit(params.row as Employee)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* ===== HEADER ===== */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Staff Management
        </Typography>
        <Typography color="text.secondary">
          Manage employees, roles, and assignments
        </Typography>
      </Box>

      {/* ===== FILTERS & ACTIONS ===== */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flex={1} width="100%">
              <TextField
                placeholder="Search by name, code, phone..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="Filter by Role"
                size="small"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value === "" ? "" : Number(e.target.value))}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.employeeRoleId} value={role.employeeRoleId}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Filter by Status"
                size="small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ whiteSpace: "nowrap" }}
            >
              Add Employee
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ===== DATA TABLE ===== */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            loading={loading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
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
            }}
          />
        </CardContent>
      </Card>

      {/* ===== DIALOG ===== */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? "Edit Employee" : "Add New Employee"}
        </DialogTitle>
        <DialogContent>
          <StaffForm
            employee={editingEmployee}
            roles={roles}
            buildings={buildings}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}