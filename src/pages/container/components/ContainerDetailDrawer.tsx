import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Button,
  Card,
  CardContent,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import type { ContainerItem } from "@/api/containerApi";
import { updateContainerPosition, deleteContainer as apiDeleteContainer, getContainer as apiGetContainer } from "@/api/containerApi";
import { useTranslation } from "react-i18next";
import ContainerFormDialog from "./ContainerFormDialog";

type Props = {
  container?: ContainerItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (containerCode: string) => void;
};

export default function ContainerDetailDrawer({ container: containerProp, open, onClose, onUpdated }: Props) {
  const { t } = useTranslation("container");
  const [container, setContainer] = useState<ContainerItem | null>(containerProp ?? null);
  const [loading, setLoading] = useState(false);

  // snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("info");

  // editable fields for position
  const [serialNumber, setSerialNumber] = useState<number | "">("");
  const [layer, setLayer] = useState<number | "">("");

  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setContainer(containerProp ?? null);
    setSerialNumber(containerProp?.serialNumber ?? "");
    setLayer(containerProp?.layer ?? "");
  }, [containerProp]);

  useEffect(() => {
    if (!open) {
      setSerialNumber(containerProp?.serialNumber ?? "");
      setLayer(containerProp?.layer ?? "");
    }
  }, [open, containerProp]);

  const headerLabel = useMemo(
    () => container?.containerCode ?? (t("labels.container") ?? "Container"),
    [container, t]
  );

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  const handleSavePosition = async () => {
    if (!container?.containerCode) {
      setSnackMsg(t("errors.noContainerCode") ?? "No container code");
      setSnackSeverity("error");
      setSnackOpen(true);
      return;
    }

    try {
      setLoading(true);
      await updateContainerPosition(container.containerCode, {
        serialNumber: serialNumber === "" ? null : Number(serialNumber),
        layer: layer === "" ? null : Number(layer),
      });

      setSnackMsg(t("messages.updatePositionSuccess") ?? "Position updated");
      setSnackSeverity("success");
      setSnackOpen(true);

      setContainer((prev) =>
        prev
          ? {
            ...prev,
            serialNumber: serialNumber === "" ? undefined : Number(serialNumber),
            layer: layer === "" ? undefined : Number(layer),
          }
          : prev
      );

      onUpdated?.(container.containerCode);
    } catch (err: any) {
      console.error("update position error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? (t("errors.unknown") ?? "Operation failed");
      setSnackMsg(msg);
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!container?.containerCode) return;
    if (!window.confirm(t("confirm.delete") ?? "Are you sure to delete this container?")) return;
    try {
      setLoading(true);
      await apiDeleteContainer(container.containerCode);
      setSnackMsg(t("messages.deleted") ?? "Deleted");
      setSnackSeverity("success");
      setSnackOpen(true);
      onUpdated?.(container.containerCode);
      onClose();
    } catch (err: any) {
      console.error("delete container failed", err);
      const msg = err?.response?.data?.message ?? err?.message ?? (t("errors.unknown") ?? "Delete failed");
      setSnackMsg(msg);
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>
                <WarehouseIcon />
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                  {headerLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {t("page.subtitle") ?? "Container details"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton onClick={onClose} disabled={loading}>
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              {t("labels.information") ?? "Information"}
            </Typography>

            <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  {has(container?.containerCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.containerCode") ?? "Code"}</Box>
                      <Box sx={{ flex: 1, fontWeight: 700 }}>{container?.containerCode}</Box>
                    </Box>
                  )}
                  {has(container?.floorCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.floorCode") ?? "Floor"}</Box>
                      <Box sx={{ flex: 1 }}>{container?.floorCode}</Box>
                    </Box>
                  )}
                  {has(container?.status) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.status") ?? "Status"}</Box>

                      <Box sx={{ flex: 1 }}>
                        {
                          t(`statusMap.${String(container?.status).toLowerCase()}`, {
                            defaultValue: container?.status
                          })
                        }
                      </Box>
                    </Box>
                  )}
                  {has(container?.type) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.type") ?? "Type"}</Box>
                      <Box sx={{ flex: 1 }}>{container?.type}</Box>
                    </Box>
                  )}
                  {container?.serialNumber !== undefined && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.serialNumber") ?? "Serial"}</Box>
                      <Box sx={{ flex: 1 }}>{container?.serialNumber ?? "-"}</Box>
                    </Box>
                  )}
                  {container?.maxWeight !== undefined && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.maxWeight") ?? "Max weight"}</Box>
                      <Box sx={{ flex: 1 }}>{container?.maxWeight ?? "-"}</Box>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.currentWeight") ?? "Current weight"}</Box>
                    <Box sx={{ flex: 1 }}>{container?.currentWeight ?? 0}</Box>
                  </Box>

                  {has(container?.notes) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.notes") ?? "Notes"}</Box>
                      <Box sx={{ flex: 1 }}>{container?.notes}</Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Typography fontWeight={700} sx={{ mb: 1 }}>
              {t("labels.position") ?? "Position"}
            </Typography>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.serialNumber") ?? "Serial"}</Box>
                    <TextField
                      size="small"
                      value={serialNumber}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") setSerialNumber("");
                        else setSerialNumber(Number(v));
                      }}
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.layer") ?? "Layer"}</Box>
                    <TextField
                      size="small"
                      value={layer}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") setLayer("");
                        else setLayer(Number(v));
                      }}
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.positionX") ?? "X"}</Box>
                    <Box sx={{ flex: 1 }}>{container?.positionX ?? "-"}</Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.positionY") ?? "Y"}</Box>
                    <Box sx={{ flex: 1 }}>{container?.positionY ?? "-"}</Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary" }}>{t("fields.positionZ") ?? "Z"}</Box>
                    <Box sx={{ flex: 1 }}>{container?.positionZ ?? "-"}</Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              {t("actions.close") ?? "Close"}
            </Button>

            <Button variant="outlined" color="error" onClick={handleDelete} disabled={loading || !container?.containerCode}>
              {t("actions.delete") ?? "Delete"}
            </Button>

            <Button variant="contained" onClick={() => setEditOpen(true)} disabled={loading || !container?.containerCode}>
              {t("actions.edit") ?? "Edit"}
            </Button>

            <Button variant="contained" onClick={handleSavePosition} disabled={loading || !container?.containerCode}>
              {t("actions.savePosition") ?? "Save position"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <ContainerFormDialog
        open={editOpen}
        mode="edit"
        initial={container ?? undefined}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          if (container?.containerCode) {
            const fresh = await apiGetContainer(container.containerCode);
            if (fresh) setContainer(fresh);
          }
          setEditOpen(false);
          onUpdated?.(container?.containerCode ?? "");
        }}
      />

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
