import { Stack, Typography, Chip, IconButton, Box } from "@mui/material";
import { DataGrid, type GridColDef, type GridRenderCellParams, type GridPaginationModel } from "@mui/x-data-grid";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Customer } from "../components/customer.types";
import { useTranslation } from "react-i18next";

type Props = {
  rows: Customer[];
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (m: GridPaginationModel) => void;
  onEdit: (row: Customer) => void;
  onDelete: (id: number | string) => void;
};

const getRowId = (row: any) => row.id ?? row.customerId ?? JSON.stringify(row);

export default function CustomerTable({ rows, rowCount, paginationModel, onPaginationModelChange, onEdit, onDelete }: Props) {
  const { t } = useTranslation("customer");

  const columns: GridColDef[] = [
    {
      field: "customerCode",
      headerName: t("table.code"),
      flex: 0.6,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonIcon sx={{ color: "primary.main", fontSize: 18 }} />
          <Typography fontWeight={600}>{params.value || "-"}</Typography>
        </Stack>
      ),
    },
    { field: "name", headerName: t("table.fullName"), flex: 1, minWidth: 150 },
    {
      field: "email",
      headerName: t("table.email"),
      flex: 1.2,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmailIcon sx={{ fontSize: 16 }} />
          <Typography fontSize={13}>{params.value || "-"}</Typography>
        </Stack>
      ),
    },
    {
      field: "phone",
      headerName: t("table.phone"),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <PhoneIcon sx={{ fontSize: 16 }} />
          <Typography fontSize={13}>{params.value || "-"}</Typography>
        </Stack>
      ),
    },
    {
      field: "address",
      headerName: t("table.address"),
      flex: 1.4,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontSize={13} sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "isActive",
      headerName: t("table.status"),
      flex: 0.5,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value ? t("table.active") : t("table.inactive")} size="small" color={params.value ? "success" : "default"} />
      ),
    },
    {
      field: "actions",
      headerName: t("table.actions"),
      flex: 0.5,
      minWidth: 110,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton color="primary" size="small" onClick={() => onEdit(params.row as Customer)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" size="small" onClick={() => onDelete(getRowId(params.row))}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ display: { xs: "none", sm: "block" }, width: "100%", overflowX: "auto" }}>
      <Box sx={{ minHeight: 360, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          pagination
          paginationMode="client"
          rowCount={rowCount}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          disableRowSelectionOnClick
          density="standard"
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee" },
            "& .MuiDataGrid-columnHeaders": { background: "#fafafa", borderBottom: "2px solid #eee" },
            width: "100%",
            minHeight: 360,
            "& .MuiDataGrid-virtualScroller": { overflowX: "auto" },
          }}
        />
      </Box>
    </Box>
  );
}
