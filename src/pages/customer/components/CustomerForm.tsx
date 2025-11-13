import  { useEffect, useState } from "react";
import {
  Stack,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
} from "@mui/material";
import type { Customer } from "./customer.types";

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    customerCode: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        customerCode: customer.customerCode,
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        password: "",
        isActive: customer.isActive,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        customerCode: `CUS${String(Date.now()).slice(-6)}`,
      }));
    }
  }, [customer]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerCode.trim()) newErrors.customerCode = "Customer code is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";

    if (!customer && !formData.password.trim()) newErrors.password = "Password is required for new customer";
    else if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = "Invalid phone number (10-11 digits)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    if (validate()) {
      const dataToSave: Partial<Customer> = { ...formData, password: formData.password || undefined };
      onSave(dataToSave);
    }
  };

  const twoColStyle = { width: { xs: "100%", sm: "50%" }, pr: { sm: 1 } };

  return (
    <Box sx={{ pt: 1 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Basic information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
            <Box sx={twoColStyle}>
              <TextField
                label="Customer Code"
                value={formData.customerCode}
                onChange={(e) => handleChange("customerCode", e.target.value)}
                fullWidth
                required
                error={!!errors.customerCode}
                helperText={errors.customerCode || (customer ? "Auto-generated and locked" : "")}
                disabled={!!customer}
                size="small"
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
              <TextField
                label="Full name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                size="small"
              />
            </Box>

            <Box sx={twoColStyle}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
                placeholder="example@gmail.com"
                size="small"
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="0901234567"
                size="small"
              />
            </Box>

            <Box sx={{ width: "100%" }}>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Enter full address"
                size="small"
              />
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Account information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              fullWidth
              required={!customer}
              error={!!errors.password}
              helperText={errors.password || (customer ? "Leave blank to keep current password" : "")}
              size="small"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  color="success"
                />
              }
              label={<Typography variant="body2">{formData.isActive ? "Active" : "Inactive"}</Typography>}
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" pt={1}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {customer ? "Update" : "Create"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
