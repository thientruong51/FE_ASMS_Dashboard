// src/pages/storage/widgets/ShelfFloorOrders.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

import type { ContainerItem } from "@/api/containerApi";

type Props = {
  shelfCode: string;
  floor: number;
  containers?: ContainerItem[];
  fetchOnMount?: boolean;
};

type OrderItem = {
  id: string;
  customer: string;
  weight: string;
  status: "Active" | "Delivered" | "Pending";
  containerCode?: string | null;
  note?: string;
};

// fallback local image you uploaded (will be transformed into a URL by the environment)
const FALLBACK_IMAGE = "/mnt/data/bc53dbe5-c1d3-4051-b9ac-eb24bf054fe1.png";

export default function ShelfFloorOrders({ shelfCode, floor, containers = [] }: Props) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [formData, setFormData] = useState<OrderItem>({ id: "", customer: "", weight: "", status: "Active", containerCode: null, note: "" });
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);

  const containersOnThisFloor = useMemo(() => containers ?? [], [containers]);

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
    if (window.confirm("Delete this order?")) setOrders((p) => p.filter((o) => o.id !== id));
  };

  const formatKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());
  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number") return v.toString();
    return String(v);
  };

  // pastel background cycle
  const pastelBg = (index: number) => (index % 2 === 0 ? "linear-gradient(180deg, #E8F6FF 0%, #E6F2FF 100%)" : "linear-gradient(180deg, #F5EAFB 0%, #F2E8FB 100%)");

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography fontWeight={600}>Orders on Floor {floor}</Typography>
          <Typography fontSize={12} color="text.secondary">Shelf: {shelfCode} • Containers: {containersOnThisFloor.length}</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>Add</Button>
      </Stack>

      <Box display="flex" gap={2}>
        {/* Left: orders list */}
        <Box flex={1}>
          {orders.length === 0 ? <Typography color="text.secondary">No orders yet.</Typography> : (
            <Stack spacing={1}>
              {orders.map((o, i) => (
                <Card key={o.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ py: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>{o.id}</Typography>
                        <Typography fontSize={12} color="text.secondary">{o.customer} • {o.weight}</Typography>
                        <Typography fontSize={12} color="text.secondary">{o.note}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small" onClick={() => openEdit(o)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteOrder(o.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Right: containers two-column card list (mimic design) */}
        <Box width={420} maxHeight={640} overflow="auto" sx={{ pr: 1 }}>
          <Typography fontWeight={600} fontSize={14} mb={1}>Containers (Floor {floor})</Typography>

          {/* container cards in two columns using flex-wrap */}
          <Box display="flex" flexWrap="wrap" gap={1.25}>
            {containersOnThisFloor.length === 0 && <Typography color="text.secondary">No containers.</Typography>}
            {containersOnThisFloor.map((c: any, idx) => {
              const cardWidth = `calc(50% - 6px)`; // two columns with small gap
              const imageUrl = c.imageUrl && c.imageUrl !== "string" ? c.imageUrl : FALLBACK_IMAGE;

              return (
                <Box key={c.containerCode ?? idx} sx={{ width: cardWidth }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      minHeight: 96,
                      display: "flex",
                      alignItems: "stretch",
                      background: pastelBg(idx),
                      position: "relative",
                    }}
                    onClick={() => setSelectedContainer(c)}
                  >
                    <CardContent sx={{ width: "100%", py: 1, px: 1.25, cursor: "pointer" }}>
                      {/* top row: lock icon + more icon */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" spacing={1} alignItems="center">
                         
                          <Typography fontSize={12} fontWeight={700}>Container Code: {c.containerCode ?? "-"}</Typography>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                         
                            alert(`Actions for ${c.containerCode ?? "-"}`);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      {/* middle: weight */}
                      <Box mt={1} mb={0.25}>
                        <Typography fontSize={13} fontWeight={600}>
                          {/* show weight with unit if numeric */}
                         Weight: {typeof c.currentWeight === "number" ? `${c.currentWeight} kg` : formatValue(c.currentWeight)}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                         Floor: {c.floorCode ?? "-"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
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
            <TextField label="Order ID" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} fullWidth disabled={!!editingOrder} />
            <TextField label="Customer" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} fullWidth />
            <TextField label="Weight" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} fullWidth />
            <TextField label="Container (optional)" select SelectProps={{ native: true }} value={formData.containerCode ?? ""} onChange={(e) => setFormData({ ...formData, containerCode: e.target.value || null })}>
              <option value="">— none —</option>
              {containersOnThisFloor.map((c: any) => <option key={c.containerCode ?? c.id} value={c.containerCode ?? c.id}>{c.containerCode ?? c.id}</option>)}
            </TextField>
            <TextField label="Status" select SelectProps={{ native: true }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderItem["status"] })} fullWidth>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </TextField>
            <TextField label="Note" value={formData.note ?? ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>Cancel</Button>
          <Button variant="contained" onClick={saveOrder}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Container detail dialog - show ALL fields (Stack + Box only) */}
      <Dialog open={!!selectedContainer} onClose={() => setSelectedContainer(null)} maxWidth="md" fullWidth>
        <DialogTitle>Container details</DialogTitle>
        <DialogContent dividers>
          {selectedContainer && (
            <Stack spacing={2}>
              {/* top: image + summary side-by-side (stacked on small screens) */}
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
                  {/* use imageUrl if valid, else fallback */}
                  {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                  <img
                    src={((selectedContainer as any).imageUrl && (selectedContainer as any).imageUrl !== "string") ? (selectedContainer as any).imageUrl : FALLBACK_IMAGE}
                    alt={(selectedContainer as any).containerCode ?? "container image"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>

                <Box flex={1}>
                  <Typography fontWeight={800} fontSize={18} mb={0.5}>
                    {(selectedContainer as any).containerCode ?? "-"}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                    {"isActive" in (selectedContainer as any) && <Chip label={(selectedContainer as any).isActive ? "Active" : "Inactive"} size="small" />}
                    {"status" in (selectedContainer as any) && (selectedContainer as any).status && <Chip label={(selectedContainer as any).status} size="small" />}
                    {"type" in (selectedContainer as any) && (selectedContainer as any).type && <Chip label={`Type: ${(selectedContainer as any).type}`} size="small" />}
                  </Stack>

                  <Typography fontSize={13} color="text.secondary" mb={0.5}>
                    Weight: {typeof (selectedContainer as any).currentWeight === "number" ? `${(selectedContainer as any).currentWeight} kg` : formatValue((selectedContainer as any).currentWeight)} / {formatValue((selectedContainer as any).maxWeight)}
                  </Typography>

                  <Typography fontSize={13} color="text.secondary">
                    Floorcode: {(selectedContainer as any).floorCode ?? "-"}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {/* full list of fields, in stacked boxes (no Grid) */}
              <Stack spacing={1}>
                {Object.entries(selectedContainer as any).map(([k, v]) => {
                  // we already showed imageUrl above, but still include if you want; here we show all except imageUrl (to avoid duplicate)
                  if (k === "imageUrl") return null;
                  return (
                    <Box key={k} sx={{ p: 1.25, borderRadius: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography fontSize={12} color="text.secondary">{formatKey(k)}</Typography>
                          <Typography fontSize={14} fontWeight={600}>{formatValue(v)}</Typography>
                        </Box>

                        {/* example small action: copy containerCode */}
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
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedContainer(null)} startIcon={<CloseIcon />}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
