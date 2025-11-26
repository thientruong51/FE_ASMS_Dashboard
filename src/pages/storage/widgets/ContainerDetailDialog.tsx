import React from "react";
import {
  Box,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Stack,
  Chip,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import type { ContainerItem } from "@/api/containerApi";

type Props = {
  open: boolean;
  container: ContainerItem | null;
  onClose: () => void;
  onSaveLocal?: (updated: ContainerItem) => void;
 
  onNotify?: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
};

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png";

const formatValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toString();
  return String(v);
};

export default function ContainerDetailDialog({ open, container, onClose, onSaveLocal, onNotify }: Props) {
  const [serialNumber, setSerialNumber] = React.useState<number | "">("");
  const [layer, setLayer] = React.useState<number | "">("");

  const initialSerial = React.useMemo(() => {
    return container && typeof (container as any).serialNumber === "number" ? (container as any).serialNumber : "";
  }, [container]);

  const initialLayer = React.useMemo(() => {
    return container && typeof (container as any).layer === "number" ? (container as any).layer : "";
  }, [container]);

  React.useEffect(() => {
    if (container) {
      setSerialNumber(typeof (container as any).serialNumber === "number" ? (container as any).serialNumber : "");
      setLayer(typeof (container as any).layer === "number" ? (container as any).layer : "");
    } else {
      setSerialNumber("");
      setLayer("");
    }
  }, [container]);

  const hasChanges = React.useMemo(() => {
    if (!container) return false;

    return serialNumber !== initialSerial || layer !== initialLayer;
  }, [serialNumber, layer, initialSerial, initialLayer, container]);

  const imageSrc =
    container && (container as any).imageUrl && typeof (container as any).imageUrl === "string"
      ? (container as any).imageUrl
      : FALLBACK_IMAGE;

  const mainFields = {
    containerCode: container?.containerCode ?? "-",
    status: container?.status ?? "-",
    type: container?.type ?? "-",
    serialNumber: (container as any)?.serialNumber ?? "-",
    floorCode: container?.floorCode ?? "-",
    weight:
      typeof container?.currentWeight === "number"
        ? `${container.currentWeight} / ${container.maxWeight ?? "-"} kg`
        : `${formatValue(container?.currentWeight)} / ${formatValue(container?.maxWeight)}`,
  };

  const auxEntries = container
    ? Object.entries(container).filter(
        ([k]) =>
          ![
            "imageUrl",
            "containerCode",
            "status",
            "type",
            "serialNumber",
            "layer",
            "floorCode",
            "currentWeight",
            "maxWeight",
          ].includes(k)
      )
    : [];

  const handleCopy = async (text?: string) => {
    try {
      await navigator.clipboard?.writeText(String(text ?? ""));
      onNotify?.("Copied to clipboard", "success");
    } catch (err) {
      onNotify?.("Copy failed", "error");
    }
  };

  const handleSaveLocal = () => {
    if (!container) return;

    if (!hasChanges) {
      onNotify?.("No changes to save.", "info");
      return;
    }

    const updated: ContainerItem = {
      ...container,
      serialNumber: serialNumber === "" ? undefined : Number(serialNumber),
      layer: layer === "" ? undefined : Number(layer),
    } as any;

    onSaveLocal?.(updated);

    onNotify?.("Saved locally — changes will be applied when you press Apply updates.", "info");

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">Container details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!container ? (
          <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>No container selected.</Box>
        ) : (
          <Stack spacing={2}>
            {/* Image + main info (side-by-side) */}
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {/* Image */}
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <img src={imageSrc} alt={mainFields.containerCode} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>

              {/* Info */}
              <Stack flex={1} spacing={0.5}>
                <Typography fontWeight={800} fontSize={18}>
                  {mainFields.containerCode}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={mainFields.status} size="small" />
                  <Chip label={`Type: ${mainFields.type}`} size="small" />
                  <Chip label={`SN: ${mainFields.serialNumber}`} size="small" />
                </Stack>

                <Typography fontSize={13} color="text.secondary">
                  Floor: {mainFields.floorCode}
                </Typography>

                <Typography fontSize={13} color="text.secondary">
                  Weight: {mainFields.weight}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => handleCopy(container.containerCode)}>
                    Copy code
                  </Button>

                  {/* Editable inputs for serialNumber & layer */}
                  <TextField
                    size="small"
                    label="Serial Number"
                    type="number"
                    value={serialNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSerialNumber(val === "" ? "" : Number(val));
                    }}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    size="small"
                    label="Layer"
                    type="number"
                    value={layer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLayer(val === "" ? "" : Number(val));
                    }}
                    sx={{ width: 120 }}
                  />
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            {/* Aux fields (2-column responsive) */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {auxEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  No additional data.
                </Typography>
              ) : (
                auxEntries.map(([k, v]) => (
                  <Box
                    key={k}
                    sx={{
                      width: { xs: "100%", sm: "48%" },
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography fontSize={11} color="text.secondary" sx={{ textTransform: "capitalize" }}>
                      {k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ")}
                    </Typography>
                    <Typography fontSize={13} fontWeight={600}>
                      {formatValue(v)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>

            {/* Save locally */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="contained" color="primary" onClick={handleSaveLocal} disabled={!hasChanges}>
                Save locally
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      
    </Dialog>
  );
}
