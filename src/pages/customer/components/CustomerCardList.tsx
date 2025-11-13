import { Box, Card, CardContent, Stack, Avatar, Typography, IconButton, Chip, Divider, Pagination } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Customer } from "./customer.types";
import type { GridPaginationModel } from "@mui/x-data-grid";

type Props = {
  rows: Customer[];
  paginationModel: GridPaginationModel;
  onPageChange: (m: GridPaginationModel) => void;
  onEdit: (row: Customer) => void;
  onDelete: (id: number | string) => void;
};

const getRowId = (row: any) => row.id ?? row.customerId ?? JSON.stringify(row);

export default function CustomerCardList({ rows, paginationModel, onPageChange, onEdit, onDelete }: Props) {
  const mobileTotalPages = Math.max(1, Math.ceil((rows.length === 0 ? 0 : rows.length) / (paginationModel.pageSize || 10)));

  return (
    <Box sx={{ display: { xs: "block", sm: "none" } }}>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No customers
        </Typography>
      ) : (
        <Box>
          {rows.map((c) => (
            <Box key={getRowId(c)} sx={{ mb: 1 }}>
              <Card variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 36, height: 36 }}><PersonIcon /></Avatar>
                      <Box>
                        <Typography fontWeight={700} sx={{ fontSize: 14 }}>{c.customerCode || "-"}</Typography>
                        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{c.name || "-"}</Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip label={c.isActive ? "Active" : "Inactive"} size="small" />
                      <IconButton size="small" color="primary" onClick={() => onEdit(c)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => onDelete(getRowId(c))}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="column" spacing={0.5}>
                    {c.email ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon sx={{ fontSize: 16 }} />
                        <Typography sx={{ fontSize: 13 }}>{c.email}</Typography>
                      </Stack>
                    ) : null}
                    {c.phone ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16 }} />
                        <Typography sx={{ fontSize: 13 }}>{c.phone}</Typography>
                      </Stack>
                    ) : null}
                    {c.address ? <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{c.address}</Typography> : null}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Pagination
          count={mobileTotalPages}
          page={paginationModel.page + 1}
          onChange={(_, page) => onPageChange({ ...paginationModel, page: page - 1 })}
          size="small"
        />
      </Box>
    </Box>
  );
}
