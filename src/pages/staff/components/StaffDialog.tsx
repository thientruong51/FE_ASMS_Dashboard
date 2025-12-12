import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import StaffForm from "./StaffForm";
import type { Employee, EmployeeRole, Building } from "@/types/staff";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  employee: Employee | null;
  roles: EmployeeRole[];
  buildings: Building[];
  onSave: (data: Partial<Employee>) => Promise<void> | void;
  onCancel: () => void;
};

export default function StaffDialog({
  open,
  employee,
  roles,
  buildings,
  onSave,
  onCancel
}: Props) {
  const { t } = useTranslation("staffPage");
  const key = employee ? `emp-${employee.id}` : "emp-new";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{employee ? t("update") : t("create")}</DialogTitle>
      <DialogContent>
        <StaffForm
          key={key}
          employee={employee}
          roles={roles}
          buildings={buildings}
          onSave={onSave}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
