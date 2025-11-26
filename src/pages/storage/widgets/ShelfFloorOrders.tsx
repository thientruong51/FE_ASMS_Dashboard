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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { ContainerItem } from "@/api/containerApi";
import ContainerDetailDialog from "./ContainerDetailDialog";
import { updateContainerPosition, getContainers } from "@/api/containerApi";

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
    if (window.confirm) {
      if (!window.confirm("Delete this order?")) return;
    }
    setOrders((p) => p.filter((o) => o.id !== id));
  };

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
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
    notify(`Saved ${updated.containerCode} locally`, "info");
  };

  const applyUpdatesToServer = async () => {
    const entries = Object.entries(editedContainers);
    if (entries.length === 0) {
      notify("No edited containers to update.", "warning");
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
        notify(`Updated ${code}`, "success");
      } catch (err) {
        console.error("Failed to update", code, err);
        notify(`Failed to update ${code}. Aborting.`, "error");
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
            notify("Data reloaded from server.", "info");
          } else {
            notify("Server returned no matching items for this floor; keeping local view.", "warning");
          }
        } else {
          notify("Updates applied — but server reload returned unexpected shape.", "warning");
        }
      } catch (err) {
        console.warn("Failed to reload containers from server", err);
        notify("Updated but failed to reload from server. Keeping local view.", "warning");
      }
    } catch (err) {
      console.error("Failed to merge/update local list", err);
      notify("Apply finished but merge failed. See console.", "warning");
    } finally {
      setIsApplying(false);
    }

    notify("Apply updates finished.", "info");
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
                Container: {c.containerCode ?? "-"}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                notify(`Actions for ${c.containerCode ?? "-"}`, "info");
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box mt={1} mb={0.25}>
            <Typography fontSize={13} fontWeight={600}>
              Weight: {typeof c.currentWeight === "number" ? `${c.currentWeight} kg` : formatValue(c.currentWeight)}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Floor: {c.floorCode ?? "-"}{" "}
              {isEdited && <span style={{ color: "#1976d2", fontWeight: 700 }}>• edited</span>}
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
            Edited containers ({editedList.length})
          </Typography>

          {/* two-column responsive grid with scroll */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.25,
              maxHeight: 640,
              overflow: "auto",
              pr: 1,
            }}
          >
            {editedList.map((c, idx) => (
              <Box key={c.containerCode ?? idx} sx={{ width: `calc(50% - 6px)` }}>
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
          <Typography color="text.secondary">Nothing is edited.</Typography>
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
                      <IconButton size="small" onClick={() => openEdit(o)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteOrder(o.id)}>
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography fontWeight={600}>Orders on Floor {floor}</Typography>
          <Typography fontSize={12} color="text.secondary">
            Shelf: {shelfCode} • Containers: {containersOnThisFloor.length}
          </Typography>
          {/* Show edited containers summary */}
          {Object.keys(editedContainers).length > 0 && (
            <Typography fontSize={12} color="warning.main">
              Edited: {Object.keys(editedContainers).join(", ")}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>
            Add
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={Object.keys(editedContainers).length === 0 || isApplying}
          >
            {isApplying ? "Applying..." : `Apply updates (${Object.keys(editedContainers).length})`}
          </Button>
        </Stack>
      </Stack>

      <Box display="flex" gap={2}>
        {/* Left: edited containers (2-column grid + scroll) or orders */}
        <Box flex={1}>{leftContent()}</Box>

        {/* Right: containers two-column card list */}
        <Box width={420} maxHeight={640} overflow="auto" sx={{ pr: 1 }}>
          <Typography fontWeight={600} fontSize={14} mb={1}>
            Containers (Floor {floor})
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={1.25}>
            {containersOnThisFloor.length === 0 && <Typography color="text.secondary">No containers.</Typography>}
            {containersOnThisFloor.map((c: any, idx) => {
              const cardWidth = `calc(50% - 6px)`;
              const isEdited = !!editedContainers[c.containerCode ?? ""];
              return (
                <Box key={c.containerCode ?? idx} sx={{ width: cardWidth }}>
                  {renderContainerCard(c, idx, isEdited)}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Order add/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingOrder ? "Edit Order" : "Add New Order"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Order ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              fullWidth
              disabled={!!editingOrder}
            />
            <TextField label="Customer" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} fullWidth />
            <TextField label="Weight" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} fullWidth />
            <TextField
              label="Container (optional)"
              select
              SelectProps={{ native: true }}
              value={formData.containerCode ?? ""}
              onChange={(e) => setFormData({ ...formData, containerCode: e.target.value || null })}
            >
              <option value="">— none —</option>
              {containersOnThisFloor.map((c: any) => (
                <option key={c.containerCode ?? c.id} value={c.containerCode ?? c.id}>
                  {c.containerCode ?? c.id}
                </option>
              ))}
            </TextField>
            <TextField
              label="Status"
              select
              SelectProps={{ native: true }}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderItem["status"] })}
              fullWidth
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </TextField>
            <TextField label="Note" value={formData.note ?? ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveOrder}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog for apply (Material UI) */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Apply updates</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to apply updates to {Object.keys(editedContainers).length} container(s)?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyUpdatesToServer} disabled={isApplying}>
            Yes, apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Container detail dialog: pass onSaveLocal and notify */}
      <ContainerDetailDialog
        open={!!selectedContainer}
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onSaveLocal={handleSaveContainerLocally}
        onNotify={notify}
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
