import  { useMemo, useState } from "react";
import { Box, Typography, Card, CardContent, useMediaQuery, useTheme, Chip, Stack } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import useStaffData from "@/hooks/useStaffData";
import StaffToolbar from "./components/StaffToolbar";
import StaffTable from "./components/StaffTable";
import StaffCardList from "./components/StaffCardList";
import StaffDialog from "./components/StaffDialog";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Employee } from "../../types/staff";

export default function StaffPage() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  const { employees, roles, buildings, loading, refresh, create, update, remove } = useStaffData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };
  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };
  const handleCancel = () => setDialogOpen(false);

  const handleSave = async (data: Partial<Employee>) => {
    try {
      if (editingEmployee) {
        await update(editingEmployee.id, data);
      } else {
        await create(data);
      }
      refresh();
      setDialogOpen(false);
    } catch (err) {
      console.error("Save error", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await remove(id);
      refresh();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const buildingMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of buildings) {
      const key = String((b as any).buildingId ?? (b as any).id ?? "");
      if (key) m[key] = b.name ?? "";
    }
    return m;
  }, [buildings]);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.includes(q));

    const empRoleName = emp.roleName ?? emp.employeeRole?.name ?? "";

    const matchesRole = filterRole === "" || empRoleName === filterRole;
    const matchesStatus = filterStatus === "" || emp.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const baseColumns: GridColDef[] = useMemo(
    () => [
      {
        field: "employeeCode",
        headerName: "Employee Code",
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => (
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography fontWeight={600} sx={{ fontSize: { xs: 12, sm: 14 } }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "name",
        headerName: "Full Name",
        minWidth: 160,
        flex: 1.6,
        renderCell: (params: GridRenderCellParams) => <Typography sx={{ fontSize: { xs: 13, sm: 14 } }}>{params.value || "-"}</Typography>,
      },
      {
        field: "employeeRole",
        headerName: "Role",
        minWidth: 140,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => {
          const roleLabel = params.row.roleName ?? params.value?.name ?? "N/A";
          return <Chip label={roleLabel} size={isSmDown ? "small" : "small"} color="primary" variant="outlined" />;
        },
      },
      {
        field: "building",
        headerName: "Building",
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => {
          const emp = params.row;
          const bName =
            emp.buildingName ??
            emp.building?.name ??
            buildingMap[String(emp.buildingId ?? "")] ??
            "-";
          return <Typography sx={{ fontSize: { xs: 12, sm: 14 } }}>{bName}</Typography>;
        },
      },
      {
        field: "phone",
        headerName: "Phone",
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => <Typography sx={{ fontSize: { xs: 12, sm: 13 } }}>{params.value || "-"}</Typography>,
      },
      {
        field: "username",
        headerName: "Username",
        minWidth: 140,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontFamily: "monospace" }}>{params.value || "-"}</Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 110,
        flex: 0.8,
        renderCell: (params: GridRenderCellParams) => {
          const isActive = params.row.isActive;
          return <Chip label={isActive ? "Active" : "Inactive"} size="small" color={isActive ? "success" : "default"} sx={{ fontWeight: 500 }} />;
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Stack direction="row" spacing={0.5}>
            <Box component="span" sx={{ cursor: "pointer" }} onClick={() => handleOpenEdit(params.row as Employee)}>
              <EditIcon fontSize="small" />
            </Box>
            <Box component="span" sx={{ cursor: "pointer" }} onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </Box>
          </Stack>
        ),
      },
    ],
    [isSmDown, buildingMap]
  );

  const visibleOnSmall = ["employeeCode", "name", "phone", "actions"];
  const visibleOnMd = ["employeeCode", "name", "employeeRole", "building", "phone", "actions"];
  const visibleFields = isSmDown ? visibleOnSmall : isMdDown ? visibleOnMd : baseColumns.map((c) => c.field);
  const columns = baseColumns.filter((c) => visibleFields.includes(c.field));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Staff Management
        </Typography>
        <Typography color="text.secondary">Manage employees, roles, and assignments</Typography>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <StaffToolbar
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            filterRole={filterRole}
            onFilterRole={setFilterRole}
            filterStatus={filterStatus}
            onFilterStatus={setFilterStatus}
            roles={roles}
            onAdd={handleOpenAdd}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: "100%" }}>
            {isSmDown ? (
              <StaffCardList employees={filteredEmployees} onEdit={handleOpenEdit} onDelete={handleDelete} />
            ) : (
              <StaffTable rows={filteredEmployees} columns={columns} loading={loading} density={isSmDown ? "compact" : "standard"} />
            )}
          </Box>
        </CardContent>
      </Card>

      <StaffDialog open={dialogOpen} employee={editingEmployee} roles={roles} buildings={buildings} onSave={handleSave} onCancel={handleCancel} />
    </Box>
  );
}
