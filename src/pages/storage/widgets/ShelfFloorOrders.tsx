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
import { useState } from "react";

type Props = {
  shelfId: number;
  floor: number;
};

type OrderItem = {
  id: string;
  customer: string;
  weight: string;
  status: "Active" | "Delivered" | "Pending";
};

export default function ShelfFloorOrders({ shelfId, floor }: Props) {
  // === STATE ===
  const [orders, setOrders] = useState<OrderItem[]>([
    { id: `ORD-${shelfId}-${floor}-1`, customer: "Alpha Co.", weight: "120 kg", status: "Active" },
    { id: `ORD-${shelfId}-${floor}-2`, customer: "Beta Logistics", weight: "150 kg", status: "Pending" },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    customer: "",
    weight: "",
    status: "Active" as OrderItem["status"],
  });

  // === CRUD HANDLERS ===
  const handleOpenAdd = () => {
    setEditingOrder(null);
    setFormData({
      id: `ORD-${shelfId}-${floor}-${orders.length + 1}`,
      customer: "",
      weight: "",
      status: "Active",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (order: OrderItem) => {
    setEditingOrder(order);
    setFormData(order);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingOrder) {
      // update
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? { ...formData } : o))
      );
    } else {
      // create
      setOrders((prev) => [...prev, { ...formData }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this order?")) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // === UI HELPERS ===
  const renderStatus = (status: OrderItem["status"]) => {
    switch (status) {
      case "Active":
        return <Chip label="Active" color="success" size="small" />;
      case "Delivered":
        return <Chip label="Delivered" color="primary" size="small" />;
      case "Pending":
        return <Chip label="Pending" color="warning" size="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontWeight={600}>Orders on Floor {floor}</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Add
        </Button>
      </Stack>

      {/* LIST */}
      {orders.length === 0 ? (
        <Typography color="text.secondary" fontSize={14}>
          No orders yet.
        </Typography>
      ) : (
        orders.map((o, i) => (
          <Card
            key={o.id}
            sx={{
              mb: 1.5,
              borderRadius: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              "&:hover": { boxShadow: "0 3px 10px rgba(0,0,0,0.15)" },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.5,
              }}
            >
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {o.id}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  {o.customer}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  {o.weight}
                </Typography>
              </Box>

              <Stack direction="row" alignItems="center" spacing={1}>
                {renderStatus(o.status)}
                <IconButton size="small" onClick={() => handleOpenEdit(o)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(o.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </CardContent>
            {i !== orders.length - 1 && <Divider />}
          </Card>
        ))
      )}

      {/* DIALOG ADD/EDIT */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {editingOrder ? "Edit Order" : "Add New Order"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Order ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              fullWidth
              disabled={!!editingOrder}
            />
            <TextField
              label="Customer"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              fullWidth
            />
            <TextField
              label="Weight"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              fullWidth
            />
            <TextField
              label="Status"
              select
              SelectProps={{ native: true }}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as OrderItem["status"] })
              }
              fullWidth
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
