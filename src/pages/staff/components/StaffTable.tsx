import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { Employee } from "@/types/staff";

type Props = {
  rows: Employee[];
  columns: GridColDef[];
  loading: boolean;
  density?: "compact" | "standard" | "comfortable";
};

export default function StaffTable({
  rows,
  columns,
  loading,
  density = "standard",
}: Props) {
  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        density={density}
        disableRowSelectionOnClick
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#f8f9fa",
            borderBottom: "2px solid #e0e0e0",
          },
          "& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader": {
            fontSize: 13,
          },
        }}
      />
    </Box>
  );
}
