import { Box, TextField, MenuItem, Button, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import type { EmployeeRole } from "@/types/staff";
import { useTranslation } from "react-i18next";

type Props = {
  searchTerm: string;
  onSearch: (v: string) => void;
  filterRole: string;
  onFilterRole: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
  roles: EmployeeRole[];
  onAdd: () => void;
};

export default function StaffToolbar({
  searchTerm,
  onSearch,
  filterRole,
  onFilterRole,
  filterStatus,
  onFilterStatus,
  roles,
  onAdd
}: Props) {
  const { t } = useTranslation("staffPage");

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        width: "100%"
      }}
    >
      <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: 0 }}>
        <TextField
          placeholder={t("searchPlaceholder")}
          size="small"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Box sx={{ width: { xs: "100%", sm: 180 } }}>
        <TextField select label={t("roleLabel")} size="small" value={filterRole} onChange={(e) => onFilterRole(String(e.target.value))} fullWidth>
          <MenuItem value="">{t("filterAllRoles")}</MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.employeeRoleId ?? role.name} value={role.name ?? ""}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ width: { xs: "100%", sm: 160 } }}>
        <TextField select label={t("filterAllStatus")} size="small" value={filterStatus} onChange={(e) => onFilterStatus(e.target.value)} fullWidth>
          <MenuItem value="">{t("filterAllStatus")}</MenuItem>
          <MenuItem value="Active">{t("statusActive")}</MenuItem>
          <MenuItem value="Inactive">{t("statusInactive")}</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" }, width: { xs: "100%", sm: "auto" } }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" } }}>
          {t("addEmployee")}
        </Button>
      </Box>
    </Box>
  );
}
