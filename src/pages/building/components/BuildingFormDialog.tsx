import  { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import type { Building } from "./types";

const STATUS_OPTIONS = ["Ready", "Maintenance", "Closed", "Draft", "Other"];

export default function BuildingFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Building;
  onClose: () => void;
  onSubmit: (payload: Partial<Building>) => Promise<void> | void;
}) {
  const [buildingCode, setBuildingCode] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ name?: string; buildingCode?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const isImageUrl = useMemo(() => {
    if (!imageUrl) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl);
  }, [imageUrl]);

  const isModelUrl = useMemo(() => {
    if (!imageUrl) return false;
    return /\.(glb|gltf|obj)$/i.test(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (initial) {
      setBuildingCode(initial.buildingCode ?? "");
      setName(initial.name ?? "");
      setArea(initial.area?.toString() ?? "");
      setAddress(initial.address ?? "");
      setStatus(initial.status ?? "");
      setIsActive(initial.isActive ?? true);
      setImageUrl(initial.imageUrl ?? null);
    } else {
      setBuildingCode("");
      setName("");
      setArea("");
      setAddress("");
      setStatus("");
      setIsActive(true);
      setImageUrl(null);
    }
    setErrors({});
  }, [initial, open]);

  function validate() {
    const e: typeof errors = {};
    if (!buildingCode.trim()) e.buildingCode = "Required";
    if (!name.trim()) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload: Partial<Building> = {
      buildingCode: buildingCode.trim(),
      name: name.trim(),
      area: area.trim(),
      address: address.trim() || undefined,
      status: status || undefined,
      isActive,
      imageUrl: imageUrl || undefined,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit Building" : "Create Building"}</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>

          <TextField
            label="Building Code"
            value={buildingCode}
            onChange={(e) => setBuildingCode(e.target.value)}
            error={!!errors.buildingCode}
            helperText={errors.buildingCode}
            required
            fullWidth
          />

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
          />

          <TextField
            label="Area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="100 / 150 / m²"
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <TextField
            label="Image URL (img / .glb / .gltf)"
            value={imageUrl ?? ""}
            onChange={(e) => setImageUrl(e.target.value || null)}
            fullWidth
          />

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(_, v) => setIsActive(v)} />}
            label={isActive ? "Active" : "Inactive"}
          />

          {/* PREVIEW */}
          <Box>
            <Typography variant="subtitle2" mb={1}>
              Preview
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                minHeight: 150,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {!imageUrl && <Typography color="text.secondary">No preview</Typography>}

              {imageUrl && isImageUrl && (
                <img
                  src={imageUrl}
                  alt="preview"
                  style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }}
                />
              )}

              {imageUrl && !isImageUrl && isModelUrl && (
                <Typography>
                  3D model detected <br /> ({imageUrl.substring(imageUrl.lastIndexOf(".") + 1)})
                </Typography>
              )}

              {imageUrl && !isImageUrl && !isModelUrl && (
                <Typography color="text.secondary">URL provided (not previewable)</Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
