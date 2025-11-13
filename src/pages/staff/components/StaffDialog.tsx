import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import StaffForm from "./StaffForm";
import type { Employee, EmployeeRole, Building } from "@/types/staff";

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
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
      <DialogContent>
        <StaffForm
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
