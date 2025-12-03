import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { ContainerItem } from "@/api/containerApi";
import ContainerDetailDialog from "./ContainerDetailDialog";
import { updateContainerPosition, getContainers } from "@/api/containerApi";

import { useTranslation } from "react-i18next";

type Props = {
  shelfCode: string;
  floor: number;
  containers?: ContainerItem[];
  fetchOnMount?: boolean;
  onContainersUpdated?: (updatedList: ContainerItem[]) => void;
};

type OrderItem = {
  id: string;
  customer: string;
  weight: string;
  status: "Active" | "Delivered" | "Pending";
  containerCode?: string | null;
  note?: string;
};

export default function ShelfFloorOrders({
  shelfCode,
  floor,
  containers = [],
  onContainersUpdated,
}: Props) {
  const { t } = useTranslation("storagePage");
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); 
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); 

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [formData, setFormData] = useState<OrderItem>({
    id: "",
    customer: "",
    weight: "",
    status: "Active",
    containerCode: null,
    note: "",
  });
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);

  const [editedContainers, setEditedContainers] = useState<Record<string, ContainerItem>>({});

  const [localContainers, setLocalContainers] = useState<ContainerItem[]>(containers ?? []);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("info");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setLocalContainers(containers ?? []);
  }, [containers]);

  const containersOnThisFloor = useMemo(() => localContainers ?? [], [localContainers]);

  const openAdd = () => {
    setEditingOrder(null);
    setFormData({
      id: `ORD-${shelfCode}-${floor}-${orders.length + 1}`,
      customer: "",
      weight: "",
      status: "Active",
      containerCode: containersOnThisFloor[0]?.containerCode ?? null,
      note: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (order: OrderItem) => {
    setEditingOrder(order);
    setFormData(order);
    setDialogOpen(true);
  };

  const saveOrder = () => {
    if (editingOrder) setOrders((p) => p.map((o) => (o.id === editingOrder.id ? { ...formData } : o)));
    else setOrders((p) => [...p, { ...formData }]);
    setDialogOpen(false);
  };

  const deleteOrder = (id: string) => {
    const confirmMsg = t("shelfFloor.confirmDelete");
    if (typeof window !== "undefined" && window.confirm) {
      if (!window.confirm(confirmMsg)) return;
    }
    setOrders((p) => p.filter((o) => o.id !== id));
  };

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return v ? t("common.yes") : t("common.no");
    if (typeof v === "number") return v.toString();
    return String(v);
  };

  const pastelBg = (index: number) =>
    index % 2 === 0
      ? "linear-gradient(180deg, #E8F6FF 0%, #E6F2FF 100%)"
      : "linear-gradient(180deg, #F5EAFB 0%, #F2E8FB 100%)";

  const notify = (message: string, severity: "success" | "info" | "warning" | "error" = "info") => {
    setSnackbarMsg(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSaveContainerLocally = (updated: ContainerItem) => {
    if (!updated?.containerCode) return;

    setEditedContainers((prev) => ({ ...prev, [updated.containerCode!]: updated }));

    setLocalContainers((prev) => {
      const found = prev.findIndex((p) => p.containerCode === updated.containerCode);
      if (found === -1) {
        return [...prev, updated];
      } else {
        const copy = [...prev];
        copy[found] = { ...copy[found], ...updated };
        return copy;
      }
    });

    setSelectedContainer(null);
    notify(t("shelfFloor.savedLocally", { code: updated.containerCode }), "info");
  };

  const applyUpdatesToServer = async () => {
    const entries = Object.entries(editedContainers);
    if (entries.length === 0) {
      notify(t("shelfFloor.noEditedContainers"), "warning");
      return;
    }

    setConfirmOpen(false);
    setIsApplying(true);

    const editedSnapshot: Record<string, ContainerItem> = { ...editedContainers };

    for (const [code, c] of entries) {
      try {
        const res = await updateContainerPosition(code, {
          serialNumber: (c as any).serialNumber ?? null,
          layer: (c as any).layer ?? null,
        });
        console.debug("updateContainerPosition", code, res);
        setEditedContainers((prev) => {
          const copy = { ...prev };
          delete copy[code];
          return copy;
        });
        notify(t("shelfFloor.updatedServer", { code }), "success");
      } catch (err) {
        console.error("Failed to update", code, err);
        notify(t("shelfFloor.failedToUpdate", { code }), "error");
        setIsApplying(false);
        return;
      }
    }

    try {
      const merged = localContainers.map((c) => {
        const key = c.containerCode ?? "";
        if (editedSnapshot[key]) {
          return { ...c, ...editedSnapshot[key] };
        }
        return c;
      });

      const missingEdited = Object.values(editedSnapshot).filter(
        (e) => !merged.some((m) => m.containerCode === e.containerCode)
      );
      const updatedForThisFloor = merged.concat(missingEdited);

      setLocalContainers(updatedForThisFloor);

      if (typeof onContainersUpdated === "function") {
        try {
          onContainersUpdated(updatedForThisFloor);
        } catch (err) {
          console.error("onContainersUpdated callback error", err);
        }
      }

      try {
        const exampleFloorCode = updatedForThisFloor[0]?.floorCode;
        let resp = await getContainers(
          exampleFloorCode
            ? { floorCode: exampleFloorCode, page: 1, pageSize: 1000 }
            : { page: 1, pageSize: 1000 }
        );

        console.debug("getContainers resp:", resp);

        if (resp && resp.pagination && resp.data && resp.pagination.total > (resp.pagination.pageSize ?? resp.data.length)) {
          const total = resp.pagination.total || 0;
          const ps = resp.pagination.pageSize || resp.data.length || 100;
          let all = resp.data ?? [];
          const pages = Math.ceil(total / ps);
          for (let p = 2; p <= pages; p++) {
            const r2 = await getContainers(exampleFloorCode ? { floorCode: exampleFloorCode, page: p, pageSize: ps } : { page: p, pageSize: ps });
            all = all.concat(r2.data ?? []);
          }
          resp = { ...resp, data: all };
          console.debug("getContainers all pages merged:", resp.data.length);
        }

        if (resp && Array.isArray(resp.data)) {
          let filtered = resp.data;
          if (exampleFloorCode) {
            filtered = resp.data.filter((x) => x.floorCode === exampleFloorCode);
          } else {
            const codes = new Set(updatedForThisFloor.map((x) => x.containerCode));
            filtered = resp.data.filter((x) => codes.has(x.containerCode));
          }

          console.debug("filtered server data length:", filtered.length, "updatedForThisFloor length:", updatedForThisFloor.length);

          if (Array.isArray(filtered) && filtered.length > 0) {
            setLocalContainers(filtered);
            if (typeof onContainersUpdated === "function") {
              try {
                onContainersUpdated(filtered);
              } catch (err) {
                console.error("onContainersUpdated callback error", err);
              }
            }
            notify(t("shelfFloor.reloadedFromServer"), "info");
          } else {
            notify(t("shelfFloor.serverReturnedNoMatching"), "warning");
          }
        } else {
          notify(t("shelfFloor.serverReloadUnexpected"), "warning");
        }
      } catch (err) {
        console.warn("Failed to reload containers from server", err);
        notify(t("shelfFloor.reloadFailedKeepLocal"), "warning");
      }
    } catch (err) {
      console.error("Failed to merge/update local list", err);
      notify(t("shelfFloor.applyMergeFailed"), "warning");
    } finally {
      setIsApplying(false);
    }

    notify(t("shelfFloor.applyFinished"), "info");
  };

  const renderContainerCard = (c: ContainerItem, idx: number, isEdited = false) => {
    return (
      <Card
        sx={{
          borderRadius: 2,
          minHeight: 96,
          display: "flex",
          alignItems: "stretch",
          background: pastelBg(idx),
          position: "relative",
          outline: isEdited ? "2px solid rgba(33,150,243,0.25)" : "none",
        }}
        onClick={() => {
          const edited = editedContainers[c.containerCode ?? ""];
          setSelectedContainer(edited ? { ...edited } : { ...(c as ContainerItem) });
        }}
      >
        <CardContent sx={{ width: "100%", py: 1, px: 1.25, cursor: "pointer" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontSize={12} fontWeight={700}>
                {t("shelfFloor.containerLabel", { code: c.containerCode ?? "-" })}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                notify(t("shelfFloor.actionsFor", { code: c.containerCode ?? "-" }), "info");
              }}
              aria-label={t("shelfFloor.moreActions")}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box mt={1} mb={0.25}>
            <Typography fontSize={13} fontWeight={600}>
              {t("shelfFloor.weightLabel", {
                weight: typeof c.currentWeight === "number" ? `${c.currentWeight} kg` : formatValue(c.currentWeight),
              })}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {t("shelfFloor.floorLabel", { floor: c.floorCode ?? "-" })}{" "}
              {isEdited && <span style={{ color: "#1976d2", fontWeight: 700 }}>• {t("shelfFloor.editedTag")}</span>}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const leftContent = () => {
    const editedList = Object.values(editedContainers);
    if (editedList.length > 0) {
      return (
        <Box>
          <Typography fontSize={13} fontWeight={700} mb={0.5}>
            {t("shelfFloor.editedContainersTitle", { count: editedList.length })}
          </Typography>

          {/* two-column responsive grid with scroll */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.25,
              maxHeight: isMdUp ? 640 : isSmUp ? 520 : 360,
              overflow: "auto",
              pr: 1,
            }}
          >
            {editedList.map((c, idx) => (
              <Box
                key={c.containerCode ?? idx}
                sx={{ width: isSmUp ? `calc(50% - 6px)` : "100%" }}
              >
                {renderContainerCard(c, idx, true)}
              </Box>
            ))}
          </Box>
        </Box>
      );
    }

    return (
      <>
        {orders.length === 0 ? (
          <Typography color="text.secondary">{t("shelfFloor.nothingEdited")}</Typography>
        ) : (
          <Stack spacing={1}>
            {orders.map((o) => (
              <Card key={o.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography fontSize={13} fontWeight={700}>
                        {o.id}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {o.customer} • {o.weight}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {o.note}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton size="small" onClick={() => openEdit(o)} aria-label={t("shelfFloor.editOrder")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteOrder(o.id)} aria-label={t("shelfFloor.deleteOrder")}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </>
    );
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={600}>
            {t("shelfFloor.ordersOnFloor", { floor })}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {t("shelfFloor.shelfAndCount", { shelf: shelfCode, count: containersOnThisFloor.length })}
          </Typography>
          {/* Show edited containers summary */}
          {Object.keys(editedContainers).length > 0 && (
            <Typography fontSize={12} color="warning.main" sx={{ wordBreak: "break-word", maxWidth: 560 }}>
              {t("shelfFloor.editedList", { list: Object.keys(editedContainers).join(", ") })}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>
            {t("shelfFloor.addButton")}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={Object.keys(editedContainers).length === 0 || isApplying}
          >
            {isApplying ? t("shelfFloor.applying") : t("shelfFloor.applyButton", { count: Object.keys(editedContainers).length })}
          </Button>
        </Stack>
      </Stack>

      <Box
        display="flex"
        gap={2}
        flexDirection={isSmUp ? "row" : "column"}
        alignItems="flex-start"
      >
        {/* Left: edited containers (2-column grid + scroll) or orders */}
        <Box flex={1} minWidth={0}>
          {leftContent()}
        </Box>

        {/* Right: containers two-column card list */}
        <Box
          sx={{
            width: isSmUp ? 420 : "100%",
            maxHeight: isMdUp ? 640 : isSmUp ? 520 : 360,
            overflow: "auto",
            pr: 1,
            pt: isSmUp ? 0 : 1,
          }}
        >
          <Typography fontWeight={600} fontSize={14} mb={1}>
            {t("shelfFloor.containersTitle", { floor })}
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={1.25}>
            {containersOnThisFloor.length === 0 && <Typography color="text.secondary">{t("shelfFloor.noContainers")}</Typography>}
            {containersOnThisFloor.map((c: any, idx) => {
              const isEdited = !!editedContainers[c.containerCode ?? ""];
              return (
                <Box
                  key={c.containerCode ?? idx}
                  sx={{ width: isSmUp ? `calc(50% - 6px)` : "100%" }}
                >
                  {renderContainerCard(c, idx, isEdited)}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Order add/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingOrder ? t("shelfFloor.editOrderTitle") : t("shelfFloor.addOrderTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("shelfFloor.orderIdLabel")}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              fullWidth
              disabled={!!editingOrder}
            />
            <TextField label={t("shelfFloor.customerLabel")} value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} fullWidth />
            <TextField label={t("shelfFloor.weightLabelShort")} value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} fullWidth />
            <TextField
              label={t("shelfFloor.containerOptional")}
              select
              SelectProps={{ native: true }}
              value={formData.containerCode ?? ""}
              onChange={(e) => setFormData({ ...formData, containerCode: e.target.value || null })}
            >
              <option value="">{t("shelfFloor.noneOption")}</option>
              {containersOnThisFloor.map((c: any) => (
                <option key={c.containerCode ?? c.id} value={c.containerCode ?? c.id}>
                  {c.containerCode ?? c.id}
                </option>
              ))}
            </TextField>
            <TextField
              label={t("shelfFloor.statusLabel")}
              select
              SelectProps={{ native: true }}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderItem["status"] })}
              fullWidth
            >
              <option value="Active">{t("shelfFloor.statusActive")}</option>
              <option value="Pending">{t("shelfFloor.statusPending")}</option>
              <option value="Delivered">{t("shelfFloor.statusDelivered")}</option>
            </TextField>
            <TextField label={t("shelfFloor.noteLabel")} value={formData.note ?? ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={saveOrder}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog for apply (Material UI) */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("shelfFloor.applyConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("shelfFloor.applyConfirmBody", { count: Object.keys(editedContainers).length })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={applyUpdatesToServer} disabled={isApplying}>
            {t("shelfFloor.confirmApply")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Container detail dialog: pass onSaveLocal and notify */}
      <ContainerDetailDialog
        open={!!selectedContainer}
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onSaveLocal={handleSaveContainerLocally}
        onNotify={(msg, sev) => notify(msg, sev ?? "info")}
      />

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3500} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
