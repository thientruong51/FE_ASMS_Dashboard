import { useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { Box as MBox } from "@mui/system";

import { translateRoleName, canonicalRoleKey } from "@/utils/roleNames";
import { translateBuildingName } from "@/utils/buildingNames";
import { getAuthClaimsFromStorage } from "@/utils/auth";

export default function StaffPage() {
  const { t } = useTranslation(["staffPage", "roleNames", "buildingNames"]);
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
    if (!window.confirm(t("confirmDeleteBody_plural"))) return;
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
      if (key) {
        const raw = (b as any).name ?? "";
        m[key] = translateBuildingName(t, raw);
      }
    }
    return m;
  }, [buildings, t]);

  const roleOptions = useMemo(() => {
    return (roles ?? []).map((r: any) => {
      const raw = r.name ?? r.roleName ?? "";
      const value = canonicalRoleKey(raw);
      const label = translateRoleName(t, raw);
      return { value, label };
    });
  }, [roles, t]);

  const claims = useMemo(() => getAuthClaimsFromStorage(), []);
  const currentRoleId = claims ? Number(claims.EmployeeRoleId) : null;
  const currentEmployeeCode = claims?.EmployeeCode ?? null;

  const roleKeyToId = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of roles ?? []) {
      const raw = (r as any).name ?? (r as any).roleName ?? "";
      const key = canonicalRoleKey(raw);
      const id = (r as any).employeeRoleId ?? (r as any).id ?? null;
      if (key && id != null) m[key] = Number(id);
    }
    return m;
  }, [roles]);

 
  const allowedRolesForViewer: Record<number, number[]> = {
    1: [2, 3],
    4: [1, 2, 3],
  };


  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return (employees ?? []).filter((emp) => {
      const matchesSearch =
        !q ||
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q));

      const empRoleName =
        (emp as any).roleName ?? (emp.employeeRole as any)?.name ?? "";

      const empRoleKey = canonicalRoleKey(empRoleName);

      const empRoleId =
        (emp as any).employeeRole?.employeeRoleId ??
        (emp as any).employeeRoleId ??
        roleKeyToId[empRoleKey] ??
        null;

      const matchesRole = filterRole === "" || empRoleKey === filterRole;
      const matchesStatus = filterStatus === "" || emp.status === filterStatus;

      // visibility based on current user's role (new)
      let visibleByRole = true;
      if (currentRoleId != null && allowedRolesForViewer[currentRoleId]) {
        const allowed = allowedRolesForViewer[currentRoleId];
        // allow if employee's role id is in allowed OR if it's the current user's own record
        visibleByRole = (empRoleId != null && allowed.includes(Number(empRoleId))) || (emp.employeeCode === currentEmployeeCode);
      }
      // combine all checks
      return matchesSearch && matchesRole && matchesStatus && visibleByRole;
    });
  }, [employees, searchTerm, filterRole, filterStatus, roleKeyToId, currentRoleId, currentEmployeeCode]);


  const baseColumns: GridColDef[] = useMemo(
    () => [
      {
        field: "employeeCode",
        headerName: t("employeeCode"),
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => (
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography fontWeight={600} sx={{ fontSize: { xs: 12, sm: 14 } }}>
              {params.value}
            </Typography>
          </Box>
        )
      },
      {
        field: "name",
        headerName: t("fullName"),
        minWidth: 160,
        flex: 1.6,
        renderCell: (params: GridRenderCellParams) => <Typography sx={{ fontSize: { xs: 13, sm: 14 } }}>{params.value || "-"}</Typography>
      },
      {
        field: "employeeRole",
        headerName: t("roleLabel"),
        minWidth: 140,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => {
          const rawRole = (params.row as any).roleName ?? (params.row as any).employeeRole?.name ?? "";
          const roleLabel = translateRoleName(t, rawRole);
          return <Chip label={roleLabel} size={isSmDown ? "small" : "small"} color="primary" variant="outlined" />;
        }
      },
      {
        field: "building",
        headerName: t("buildingLabel"),
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => {
          const emp = params.row as any;
          const rawB = emp.buildingName ?? emp.building?.name ?? "";
          const bLabel = translateBuildingName(t, rawB);
          return <Typography sx={{ fontSize: { xs: 12, sm: 14 } }}>{bLabel || "-"}</Typography>;
        }
      },
      {
        field: "phone",
        headerName: t("phone"),
        minWidth: 120,
        flex: 0.9,
        renderCell: (params: GridRenderCellParams) => <Typography sx={{ fontSize: { xs: 12, sm: 13 } }}>{params.value || "-"}</Typography>
      },
      {
        field: "username",
        headerName: t("username"),
        minWidth: 140,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontFamily: "monospace" }}>{params.value || "-"}</Typography>
      },
      {
        field: "status",
        headerName: t("tableActions"),
        minWidth: 110,
        flex: 0.8,
        renderCell: (params: GridRenderCellParams) => {
          const isActive = params.row.isActive;
          return <Chip label={isActive ? t("statusActive") : t("statusInactive")} size="small" color={isActive ? "success" : "default"} sx={{ fontWeight: 500 }} />;
        }
      },
      {
        field: "actions",
        headerName: t("tableActions"),
        width: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Stack direction="row" spacing={0.5}>
            <MBox component="span" sx={{ cursor: "pointer" }} onClick={() => handleOpenEdit(params.row as Employee)} aria-label={t("edit")}>
              <EditIcon fontSize="small" />
            </MBox>
            <MBox component="span" sx={{ cursor: "pointer" }} onClick={() => handleDelete(params.row.id)} aria-label={t("delete")}>
              <DeleteIcon fontSize="small" />
            </MBox>
          </Stack>
        )
      }
    ],
    [t, isSmDown, buildingMap]
  );

  const visibleOnSmall = ["employeeCode", "name", "phone", "actions"];
  const visibleOnMd = ["employeeCode", "name", "employeeRole", "building", "phone", "actions"];
  const visibleFields = isSmDown ? visibleOnSmall : isMdDown ? visibleOnMd : baseColumns.map((c) => c.field);
  const columns = baseColumns.filter((c) => visibleFields.includes(c.field));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">{t("subtitle")}</Typography>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          {/* StaffToolbar: pass role/building options (value = canonical key, label = translated) */}
          {/* cast to any to avoid type mismatch if StaffToolbar expects EmployeeRole[] */}
          <StaffToolbar
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            filterRole={filterRole}
            onFilterRole={(val) => setFilterRole(val ?? "")}
            filterStatus={filterStatus}
            onFilterStatus={setFilterStatus}
            roles={roleOptions as any}
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
