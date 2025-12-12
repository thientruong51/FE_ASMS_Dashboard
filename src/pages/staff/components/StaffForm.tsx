import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Divider
} from "@mui/material";
import type { Employee, EmployeeRole, Building } from "@/types/staff";
import { useTranslation } from "react-i18next";

interface StaffFormProps {
  employee: Employee | null;
  roles: EmployeeRole[];
  buildings: Building[];
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

function TwoColRowInner({ children, gap = 2 }: { children: React.ReactNode; gap?: number | string }) {
  return (
    <Box sx={{ display: "flex", gap, flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch", width: "100%" }}>
      {Array.isArray(children)
        ? (children as React.ReactNode[]).map((child, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
              {child}
            </Box>
          ))
        : <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>}
    </Box>
  );
}

export function TwoColRow(props: { children: React.ReactNode; gap?: number | string }) {
  return <TwoColRowInner {...props} />;
}

function StaffFormInner({ employee, roles, buildings, onSave, onCancel }: StaffFormProps) {
  const { t } = useTranslation("staffPage");

  const [formData, setFormData] = useState({
    employeeCode: "",
    name: "",
    employeeRoleId: undefined as number | undefined,
    roleName: "" as string,
    buildingId: undefined as number | undefined,
    phone: "",
    address: "",
    username: "",
    password: "",
    status: "Active",
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // debug log to see when employee prop changes
    // remove console.log when not needed
    // console.log("StaffForm: employee prop changed", employee);
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode ?? "",
        name: employee.name ?? "",
        employeeRoleId: employee.employeeRoleId ?? undefined,
        roleName: employee.roleName ?? employee.employeeRole?.name ?? "",
        buildingId: employee.buildingId ?? employee.building?.buildingId,
        phone: employee.phone ?? "",
        address: employee.address ?? "",
        username: employee.username ?? "",
        password: "",
        status: employee.status ?? "Active",
        isActive: employee.isActive ?? true
      });
    } else {
      setFormData({
        employeeCode: `EMP${String(Date.now()).slice(-6)}`,
        name: "",
        employeeRoleId: undefined,
        roleName: "",
        buildingId: undefined,
        phone: "",
        address: "",
        username: "",
        password: "",
        status: "Active",
        isActive: true
      });
    }
  }, [employee]);

  useEffect(() => {
    if (!formData.roleName && formData.employeeRoleId) {
      const match = roles.find((r) => String((r as any).employeeRoleId ?? (r as any).id ?? "") === String(formData.employeeRoleId));
      if (match && match.name) {
        setFormData((prev) => ({ ...prev, roleName: match.name ?? "" }));
      }
    }
  }, [roles, formData.employeeRoleId, formData.roleName]);

  const handleChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.employeeCode.trim()) newErrors.employeeCode = t("required", { field: t("employeeCode") });
    if (!formData.name.trim()) newErrors.name = t("required", { field: t("fullName") });
    if (!formData.employeeRoleId && !formData.roleName.trim()) newErrors.employeeRoleId = t("required", { field: t("roleLabel") });
    if (!formData.username.trim()) newErrors.username = t("required", { field: t("username") });
    if (!employee && !formData.password.trim()) newErrors.password = t("required", { field: t("password") });
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = t("invalidPhone");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, employee, t]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const dataToSave: Partial<Employee> = {
      employeeCode: formData.employeeCode,
      name: formData.name,
      employeeRoleId: formData.employeeRoleId,
      roleName: formData.roleName || undefined,
      buildingId: formData.buildingId,
      phone: formData.phone,
      address: formData.address,
      username: formData.username,
      password: formData.password || undefined,
      status: formData.status,
      isActive: formData.isActive
    };
    onSave(dataToSave);
  }, [formData, onSave, validate]);

  const roleLookup = useMemo(() => {
    const m = new Map<string, EmployeeRole>();
    for (const r of roles) {
      const key = String((r as any).employeeRoleId ?? (r as any).id ?? r.name ?? "");
      if (key) m.set(key, r);
    }
    return m;
  }, [roles]);

  const roleOptions = useMemo(() => {
    const values: string[] = [];
    const items = roles.map((r) => {
      const value = String((r as any).employeeRoleId ?? (r as any).id ?? r.name ?? "");
      const label = r.name ?? value;
      values.push(value);
      return (
        <MenuItem key={value} value={value}>
          {label}
        </MenuItem>
      );
    });

    const currentVal = formData.employeeRoleId ? String(formData.employeeRoleId) : (formData.roleName ?? "");
    if (currentVal && !values.includes(currentVal)) {
      items.unshift(
        <MenuItem key={`_current_${currentVal}`} value={currentVal}>
          {formData.roleName || currentVal}
        </MenuItem>
      );
    }

    return items;
  }, [roles, formData.employeeRoleId, formData.roleName]);

  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => {
        const value = String((b as any).buildingId ?? (b as any).id ?? "");
        return (
          <MenuItem key={value} value={value}>
            {b.name}
          </MenuItem>
        );
      }),
    [buildings]
  );

  const handleRoleSelect = useCallback(
    (val: string) => {
      if (!val) {
        handleChange("employeeRoleId", undefined);
        handleChange("roleName", "");
        return;
      }
      if (/^\d+$/.test(val) && roleLookup.has(val)) {
        const r = roleLookup.get(val)!;
        handleChange("employeeRoleId", Number(val));
        handleChange("roleName", r.name ?? "");
      } else if (/^\d+$/.test(val)) {
        handleChange("employeeRoleId", Number(val));
        handleChange("roleName", "");
      } else {
        handleChange("employeeRoleId", undefined);
        handleChange("roleName", val);
      }
    },
    [handleChange, roleLookup]
  );

  return (
    <Box sx={{ pt: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("title")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TwoColRow>
              <TextField
                label={t("employeeCode")}
                value={formData.employeeCode}
                onChange={(e) => handleChange("employeeCode", e.target.value)}
                fullWidth
                required
                error={!!errors.employeeCode}
                helperText={errors.employeeCode}
                disabled={!!employee}
              />
              <TextField
                label={t("fullName")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </TwoColRow>

            <TwoColRow>
              <TextField
                select
                label={t("roleLabel")}
                value={formData.employeeRoleId ? String(formData.employeeRoleId) : formData.roleName ?? ""}
                onChange={(e) => handleRoleSelect(String(e.target.value))}
                fullWidth
                required
                error={!!errors.employeeRoleId}
                helperText={errors.employeeRoleId}
              >
                <MenuItem value="">
                  <em>{t("filterAllRoles")}</em>
                </MenuItem>
                {roleOptions}
              </TextField>

              <TextField
                select
                label={t("buildingLabel")}
                value={formData.buildingId ?? ""}
                onChange={(e) => handleChange("buildingId", e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
              >
                <MenuItem value="">
                  <em>{t("filterAllRoles")}</em>
                </MenuItem>
                {buildingOptions}
              </TextField>
            </TwoColRow>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("contact")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TwoColRow>
              <TextField
                label={t("phone")}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="0901234567"
              />
              <Box />
            </TwoColRow>

            <Box>
              <TextField label={t("address")} value={formData.address} onChange={(e) => handleChange("address", e.target.value)} fullWidth multiline rows={2} />
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("account")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TwoColRow>
              <TextField
                label={t("username")}
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                fullWidth
                required
                error={!!errors.username}
                helperText={errors.username}
              />
              <TextField
                label={t("password")}
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                fullWidth
                required={!employee}
                error={!!errors.password}
                helperText={errors.password || (employee ? t("leaveBlankKeep") : "")}
              />
            </TwoColRow>

            <Box>
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
                label={<Typography variant="body2">{formData.isActive ? t("statusActive") : t("statusInactive")}</Typography>}
              />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", pt: 2 }}>
          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button onClick={onCancel} variant="outlined" fullWidth>
              {t("cancel")}
            </Button>
          </Box>

          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button onClick={handleSubmit} variant="contained" fullWidth>
              {employee ? t("update") : t("create")}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

export default StaffFormInner;
