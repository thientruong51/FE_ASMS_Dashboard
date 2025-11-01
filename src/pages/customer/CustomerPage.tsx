import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { useState, useEffect } from "react";
import CustomerForm from "./components/CustomerForm";
import type { Customer } from "./components/customer.types";

export default function CustomerPage() {
  // ===== STATE =====
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<boolean | "">("");

  useEffect(() => {
    setCustomers([
      {
        id: 1,
        customerCode: "CUS001",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        email: "nguyenvana@gmail.com",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        isActive: true,
      },
      {
        id: 2,
        customerCode: "CUS002",
        name: "Trần Thị B",
        phone: "0902345678",
        email: "tranthib@gmail.com",
        address: "456 Đường XYZ, Quận 2, TP.HCM",
        isActive: true,
      },
      {
        id: 3,
        customerCode: "CUS003",
        name: "Lê Văn C",
        phone: "0903456789",
        email: "levanc@gmail.com",
        address: "789 Đường DEF, Quận 3, TP.HCM",
        isActive: false,
      },
      {
        id: 4,
        customerCode: "CUS004",
        name: "Phạm Thị D",
        phone: "0904567890",
        email: "phamthid@gmail.com",
        address: "321 Đường GHI, Quận 4, TP.HCM",
        isActive: true,
      },
    ]);
  }, []);

  // ===== HANDLERS =====
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleSave = (data: Partial<Customer>) => {
    if (editingCustomer) {
      // Update
      setCustomers((prev) =>
        prev.map((cust) =>
          cust.id === editingCustomer.id
            ? { ...cust, ...data }
            : cust
        )
      );
    } else {
      // Create
      const newCustomer: Customer = {
        id: customers.length + 1,
        customerCode: data.customerCode || `CUS${String(customers.length + 1).padStart(3, "0")}`,
        name: data.name!,
        phone: data.phone,
        email: data.email!,
        address: data.address,
        password: data.password,
        isActive: data.isActive ?? true,
      };
      setCustomers((prev) => [...prev, newCustomer]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setCustomers((prev) => prev.filter((cust) => cust.id !== id));
    }
  };

  // ===== FILTERING =====
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone?.includes(searchTerm);

    const matchesStatus = filterStatus === "" || cust.isActive === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // ===== DATA GRID COLUMNS =====
  const columns: GridColDef[] = [
    {
      field: "customerCode",
      headerName: "Customer Code",
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography fontWeight={600} fontSize={14}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Full Name",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={14}>{params.value || "-"}</Typography>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography fontSize={13}>{params.value || "-"}</Typography>
        </Box>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography fontSize={13}>{params.value || "-"}</Typography>
        </Box>
      ),
    },
    {
      field: "address",
      headerName: "Address",
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={13} sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          size="small"
          color={params.value ? "success" : "default"}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenEdit(params.row as Customer)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* ===== HEADER ===== */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Customer Management
        </Typography>
        <Typography color="text.secondary">
          Manage customers, contacts, and accounts
        </Typography>
      </Box>

      {/* ===== FILTERS & ACTIONS ===== */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flex={1} width="100%">
              <TextField
                placeholder="Search by name, code, email, phone..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="Filter by Status"
                size="small"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value === "" ? "" : e.target.value === "true")
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ whiteSpace: "nowrap" }}
            >
              Add Customer
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ===== DATA TABLE ===== */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <DataGrid
            rows={filteredCustomers}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f0f0f0",
              },
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f8f9fa",
                borderBottom: "2px solid #e0e0e0",
              },
            }}
          />
        </CardContent>
      </Card>

      {/* ===== DIALOG ===== */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? "Edit Customer" : "Add New Customer"}
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}