import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import type { StorageType } from "./types";

export default function StorageTypeFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: StorageType;
  onClose: () => void;
  onSubmit: (payload: Partial<StorageType>) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const lengthNum = Number(parseFloat(length) || 0);
  const widthNum = Number(parseFloat(width) || 0);
  const heightNum = Number(parseFloat(height) || 0);

  const area = useMemo(() => {
    const a = lengthNum * widthNum;
    return isFinite(a) ? a : 0;
  }, [lengthNum, widthNum]);

  const totalVolume = useMemo(() => {
    const v = lengthNum * widthNum * heightNum;
    return isFinite(v) ? v : 0;
  }, [lengthNum, widthNum, heightNum]);

  const isImageUrl = useMemo(() => {
    if (!imageUrl) return false;
    return /\.(jpe?g|png|webp|gif|bmp)$/i.test(imageUrl);
  }, [imageUrl]);

  const isModelUrl = useMemo(() => {
    if (!imageUrl) return false;
    return /\.(glb|gltf|obj)$/i.test(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setLength(initial.length != null ? String(initial.length) : "");
      setWidth(initial.width != null ? String(initial.width) : "");
      setHeight(initial.height != null ? String(initial.height) : "");
      setImageUrl(initial.imageUrl ?? null);
      setPrice(initial.price != null ? String(initial.price) : "");
    } else {
      setName("");
      setLength("");
      setWidth("");
      setHeight("");
      setImageUrl(null);
      setPrice("");
    }
    setErrors({});
  }, [initial, open]);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload: Partial<StorageType> = {
      name: name.trim(),
      length: Number(parseFloat(length) || 0),
      width: Number(parseFloat(width) || 0),
      height: Number(parseFloat(height) || 0),
      area: Number(area),
      totalVolume: Number(totalVolume),
      imageUrl: imageUrl || undefined,
      price: price ? Number(parseFloat(price)) : undefined,
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
      <DialogTitle>{initial ? "Edit Storage Type" : "Create Storage Type"}</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={!!errors.name} helperText={errors.name} required fullWidth />

          <Box display="flex" gap={1}>
            <TextField label="Length (m)" value={length} onChange={(e) => setLength(e.target.value)} fullWidth />
            <TextField label="Width (m)" value={width} onChange={(e) => setWidth(e.target.value)} fullWidth />
            <TextField label="Height (m)" value={height} onChange={(e) => setHeight(e.target.value)} fullWidth />
          </Box>

          <Box display="flex" gap={1}>
            <TextField label="Area (m²)" value={Number.isFinite(area) ? area.toFixed(2) : ""} InputProps={{ readOnly: true }} fullWidth />
            <TextField label="Volume (m³)" value={Number.isFinite(totalVolume) ? totalVolume.toFixed(2) : ""} InputProps={{ readOnly: true }} fullWidth />
          </Box>

          <TextField label="Image / Model URL (.jpg | .png | .glb | .gltf | .obj)" value={imageUrl ?? ""} onChange={(e) => setImageUrl(e.target.value || null)} fullWidth />

          <TextField label="Price" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />

          <Box>
            <Typography variant="subtitle2" mb={1}>
              Preview
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imageUrl && (
                <Typography color="text.secondary">No preview</Typography>
              )}

              {imageUrl && isImageUrl && <img src={imageUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />}

              {imageUrl && isModelUrl && <Typography>3D model detected ({imageUrl.substring(imageUrl.lastIndexOf(".") + 1)}) — preview available on list.</Typography>}

              {imageUrl && !isImageUrl && !isModelUrl && <Typography color="text.secondary">URL provided (not previewable)</Typography>}
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
