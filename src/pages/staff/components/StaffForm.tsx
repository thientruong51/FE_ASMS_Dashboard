import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
} from "@mui/material";
import type { Employee, EmployeeRole, Building } from "@/types/staff";
import { useTranslation } from "react-i18next";

/* ---------- helpers ---------- */

function TwoColRow({ children, gap = 2 }: { children: React.ReactNode; gap?: number | string }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap,
        flexDirection: { xs: "column", sm: "row" },
        width: "100%",
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
              {child}
            </Box>
          ))
        : <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>}
    </Box>
  );
}

/* ---------- props ---------- */

interface StaffFormProps {
  employee: Employee | null;
  roles: EmployeeRole[];
  buildings: Building[];
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

/* ---------- component ---------- */

export default function StaffForm({
  employee,
  roles,
  buildings,
  onSave,
  onCancel,
}: StaffFormProps) {
  const { t } = useTranslation("staffPage");

  /* ---------- state ---------- */

  const [formData, setFormData] = useState<{
    employeeCode: string;
    name: string;
    employeeRoleId?: number;
    buildingId?: number;
    phone: string;
    address: string;
    username: string;
    password: string;
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
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------- init form ---------- */

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode ?? "",
        name: employee.name ?? "",
        employeeRoleId:
          employee.employeeRoleId ??
          employee.employeeRole?.employeeRoleId,
        buildingId:
          employee.buildingId ??
          employee.building?.buildingId,
        phone: employee.phone ?? "",
        address: employee.address ?? "",
        username: employee.username ?? "",
        password: "",
        isActive: employee.isActive ?? true,
      });
    } else {
      setFormData({
        employeeCode: `EMP${String(Date.now()).slice(-6)}`,
        name: "",
        employeeRoleId: undefined,
        buildingId: undefined,
        phone: "",
        address: "",
        username: "",
        password: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [employee]);

  /* ---------- handlers ---------- */

  const handleChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const validate = useCallback(() => {
    const e: Record<string, string> = {};

    if (!formData.employeeCode.trim())
      e.employeeCode = t("required", { field: t("employeeCode") });

    if (!formData.name.trim())
      e.name = t("required", { field: t("fullName") });

    if (!formData.employeeRoleId)
      e.employeeRoleId = t("required", { field: t("roleLabel") });

    if (!formData.username.trim())
      e.username = t("required", { field: t("username") });

    if (!employee && !formData.password.trim())
      e.password = t("required", { field: t("password") });

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone))
      e.phone = t("invalidPhone");

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData, employee, t]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload: Partial<Employee> = {
      employeeCode: formData.employeeCode,
      name: formData.name,
      employeeRoleId: formData.employeeRoleId, // 🔥 CHỈ DÙNG ID
      buildingId: formData.buildingId,
      phone: formData.phone,
      address: formData.address,
      username: formData.username,
      password: formData.password || undefined,
      isActive: formData.isActive,
    };

    onSave(payload);
  }, [formData, onSave, validate]);

  /* ---------- render ---------- */

  return (
    <Box sx={{ pt: 2 }}>
      <Stack spacing={3}>
        {/* BASIC */}
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
                disabled={!!employee}
                error={!!errors.employeeCode}
                helperText={errors.employeeCode}
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
                value={formData.employeeRoleId ?? ""}
                onChange={(e) =>
                  handleChange(
                    "employeeRoleId",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                fullWidth
                required
                error={!!errors.employeeRoleId}
                helperText={errors.employeeRoleId}
              >
                <MenuItem value="">
                  <em>{t("filterAllRoles")}</em>
                </MenuItem>
                {roles.map((r) => (
                  <MenuItem
                    key={r.employeeRoleId}
                    value={r.employeeRoleId}
                  >
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label={t("buildingLabel")}
                value={formData.buildingId ?? ""}
                onChange={(e) =>
                  handleChange(
                    "buildingId",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  <em>{t("filterAllRoles")}</em>
                </MenuItem>
                {buildings.map((b) => (
                  <MenuItem
                    key={b.buildingId}
                    value={b.buildingId}
                  >
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>
            </TwoColRow>
          </Stack>
        </Box>

        {/* CONTACT */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("contact")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TwoColRow>
            <TextField
              label={t("phone")}
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
            />
            <Box />
          </TwoColRow>

          <TextField
            label={t("address")}
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </Box>

        {/* ACCOUNT */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("account")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

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
              helperText={
                errors.password || (employee ? t("leaveBlankKeep") : "")
              }
            />
          </TwoColRow>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  handleChange("isActive", e.target.checked)
                }
                color="success"
              />
            }
            label={
              <Typography variant="body2">
                {formData.isActive
                  ? t("statusActive")
                  : t("statusInactive")}
              </Typography>
            }
          />
        </Box>

        {/* ACTIONS */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "flex-end",
            pt: 2,
          }}
        >
          <Button onClick={onCancel} variant="outlined">
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {employee ? t("update") : t("create")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
