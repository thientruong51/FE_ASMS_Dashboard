import { Stack, Card, CardContent, Box, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import type { Employee } from "@/types/staff";
import { useTranslation } from "react-i18next";

type Props = {
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onDelete: (id: number) => void;
};

export default function StaffCardList({ employees, onEdit, onDelete }: Props) {
  const { t } = useTranslation("staffPage");

  return (
    <Stack spacing={2}>
      {employees.map((emp) => (
        <Card key={emp.id} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
              <PersonIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} sx={{ fontSize: 13 }}>
                  {emp.employeeCode}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {emp.name || "-"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <IconButton size="small" color="primary" onClick={() => onEdit(emp)} aria-label={t("edit")}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(emp.id)} aria-label={t("delete")}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}

      {employees.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
          {t("noEmployees")}
        </Typography>
      )}
    </Stack>
  );
}
