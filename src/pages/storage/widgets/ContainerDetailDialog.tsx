import {
  Box,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import type { ContainerItem } from "@/api/containerApi";

type Props = {
  open: boolean;
  container: ContainerItem | null;
  onClose: () => void;
};

const FALLBACK_IMAGE = "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png";

const formatKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());
const formatValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toString();
  return String(v);
};

export default function ContainerDetailDialog({ open, container, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Container details</DialogTitle>

      <DialogContent dividers>
        {container ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: { xs: "100%", sm: 280 },
                  height: 200,
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <img
                  src={(container as any).imageUrl && (container as any).imageUrl !== "string" ? (container as any).imageUrl : FALLBACK_IMAGE}
                  alt={(container as any).containerCode ?? "container image"}
                  style={{ width: "65%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              <Box flex={1}>
                <Typography fontWeight={800} fontSize={18} mb={0.5}>
                  {(container as any).containerCode ?? "-"}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {"isActive" in (container as any) && <Chip label={(container as any).isActive ? "Active" : "Inactive"} size="small" />}
                  {"status" in (container as any) && (container as any).status && <Chip label={(container as any).status} size="small" />}
                  {"type" in (container as any) && (container as any).type && <Chip label={`Type: ${(container as any).type}`} size="small" />}
                </Stack>

                <Typography fontSize={13} color="text.secondary" mb={0.5}>
                  Weight: {typeof (container as any).currentWeight === "number" ? `${(container as any).currentWeight} kg` : formatValue((container as any).currentWeight)} / {formatValue((container as any).maxWeight)}
                </Typography>

                <Typography fontSize={13} color="text.secondary">
                  Floorcode: {(container as any).floorCode ?? "-"}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              {Object.entries(container as any).map(([k, v]) => {
                if (k === "imageUrl") return null;
                return (
                  <Box key={k} sx={{ p: 1.25, borderRadius: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontSize={12} color="text.secondary">{formatKey(k)}</Typography>
                        <Typography fontSize={14} fontWeight={600}>{formatValue(v)}</Typography>
                      </Box>

                      {k === "containerCode" && (
                        <Button size="small" onClick={() => { navigator.clipboard?.writeText(String(v ?? "")); alert("Copied containerCode"); }}>
                          Copy
                        </Button>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        ) : (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>No container selected.</Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
