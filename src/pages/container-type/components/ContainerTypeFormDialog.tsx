import  { useEffect, useMemo, useState } from "react";
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
import type { ContainerType } from "./types";

export default function ContainerTypeFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: ContainerType;
  onClose: () => void;
  onSubmit: (payload: Partial<ContainerType>) => Promise<void> | void;
}) {
  const [type, setType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<{ type?: string }>({});
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
      setType(initial.type ?? "");
      setLength(String(initial.length ?? ""));
      setWidth(String(initial.width ?? ""));
      setHeight(String(initial.height ?? ""));
      setImageUrl(initial.imageUrl ?? null);
      setPrice(initial.price ? String(initial.price) : "");
    } else {
      setType("");
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
    if (!type.trim()) e.type = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload: Partial<ContainerType> = {
      type: type.trim(),
      length: Number(parseFloat(length) || 0),
      width: Number(parseFloat(width) || 0),
      height: Number(parseFloat(height) || 0),
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
      <DialogTitle>{initial ? "Edit Container Type" : "Create Container Type"}</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            error={!!errors.type}
            helperText={errors.type}
            required
            fullWidth
          />

          <Box display="flex" gap={1}>
            <TextField label="Length (m)" value={length} onChange={(e) => setLength(e.target.value)} fullWidth />
            <TextField label="Width (m)" value={width} onChange={(e) => setWidth(e.target.value)} fullWidth />
            <TextField label="Height (m)" value={height} onChange={(e) => setHeight(e.target.value)} fullWidth />
          </Box>

          <TextField label="Image / Model URL (.jpg | .png | .glb | .gltf)" value={imageUrl ?? ""} onChange={(e) => setImageUrl(e.target.value || null)} fullWidth />

          <TextField label="Price" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />

          <Box>
            <Typography variant="subtitle2" mb={1}>
              Preview
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imageUrl && <Typography color="text.secondary">No preview</Typography>}

              {imageUrl && isImageUrl && (
                <img src={imageUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
              )}

              {imageUrl && !isImageUrl && isModelUrl && (
                <Typography>3D model detected ({imageUrl.substring(imageUrl.lastIndexOf(".") + 1)})</Typography>
              )}

              {imageUrl && !isImageUrl && !isModelUrl && <Typography color="text.secondary">URL provided (not previewable)</Typography>}
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
