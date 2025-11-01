import {
  Stack,
  TextField,
  MenuItem,
  Button,
  Box,
  FormControlLabel,
  Switch,
Grid,
  Typography,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";

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

interface StaffFormProps {
  employee: Employee | null;
  roles: EmployeeRole[];
  buildings: Building[];
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

export default function StaffForm({ 
  employee, 
  roles, 
  buildings, 
  onSave, 
  onCancel 
}: StaffFormProps) {
  // ✅ FIX: Correct type for formData
  const [formData, setFormData] = useState<{
    employeeCode: string;
    name: string;
    employeeRoleId: number | undefined;
    buildingId: number | undefined;
    phone: string;
    address: string;
    username: string;
    password: string;
    status: string;
    isActive: boolean;
  }>({
    employeeCode: "",
    name: "",
    employeeRoleId: undefined,
    buildingId: undefined,
    phone: "",
    address: "",
    username: "",
    password: "",
    status: "Active",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode,
        name: employee.name || "",
        employeeRoleId: employee.employeeRoleId,
        buildingId: employee.buildingId,
        phone: employee.phone || "",
        address: employee.address || "",
        username: employee.username || "",
        password: "",
        status: employee.status || "Active",
        isActive: employee.isActive,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        employeeCode: `EMP${String(Date.now()).slice(-6)}`,
      }));
    }
  }, [employee]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = "Employee code is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.employeeRoleId) {
      newErrors.employeeRoleId = "Role is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!employee && !formData.password.trim()) {
      newErrors.password = "Password is required for new employee";
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number (10-11 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    if (validate()) {
      // ✅ FIX: Convert formData to match Employee type
      const dataToSave: Partial<Employee> = {
        employeeCode: formData.employeeCode,
        name: formData.name,
        employeeRoleId: formData.employeeRoleId,
        buildingId: formData.buildingId,
        phone: formData.phone,
        address: formData.address,
        username: formData.username,
        password: formData.password || undefined,
        status: formData.status,
        isActive: formData.isActive,
      };
      onSave(dataToSave);
    }
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* ✅ FIX: Use Grid2 (Grid container/item) */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Employee Code"
                value={formData.employeeCode}
                onChange={(e) => handleChange("employeeCode", e.target.value)}
                fullWidth
                required
                error={!!errors.employeeCode}
                helperText={errors.employeeCode}
                disabled={!!employee}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Role"
                value={formData.employeeRoleId || ""}
                onChange={(e) => handleChange("employeeRoleId", e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
                required
                error={!!errors.employeeRoleId}
                helperText={errors.employeeRoleId}
              >
                {roles.map((role) => (
                  <MenuItem key={role.employeeRoleId} value={role.employeeRoleId}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Building"
                value={formData.buildingId || ""}
                onChange={(e) => handleChange("buildingId", e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.buildingId} value={building.buildingId}>
                    {building.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Contact Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="0901234567"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Account Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                fullWidth
                required
                error={!!errors.username}
                helperText={errors.username}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                fullWidth
                required={!employee}
                error={!!errors.password}
                helperText={errors.password || (employee ? "Leave blank to keep current" : "")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => {
                      const isActive = e.target.checked;
                      handleChange("isActive", isActive);
                      handleChange("status", isActive ? "Active" : "Inactive");
                    }}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" pt={2}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {employee ? "Update" : "Create"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}