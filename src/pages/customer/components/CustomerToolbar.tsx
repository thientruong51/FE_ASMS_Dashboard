import { Stack, TextField, InputAdornment, MenuItem, Button, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";

type Props = {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  filterStatus: "" | "true" | "false";
  onFilterStatusChange: (v: "" | "true" | "false") => void;
  onAdd: () => void;
};

export default function CustomerToolbar({ searchTerm, onSearchTermChange, filterStatus, onFilterStatusChange, onAdd }: Props) {
  const { t } = useTranslation("customer");

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flex={1} alignItems="center" sx={{ width: "100%" }}>
        <TextField
          size="small"
          placeholder={t("toolbar.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { sm: 220 }, width: { xs: "100%", sm: "auto" } }}
        />

        <TextField
          select
          size="small"
          label={t("toolbar.statusLabel")}
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as any)}
          sx={{ width: { xs: "100%", sm: 140 } }}
        >
          <MenuItem value="">{t("toolbar.statusAll")}</MenuItem>
          <MenuItem value="true">{t("toolbar.statusActive")}</MenuItem>
          <MenuItem value="false">{t("toolbar.statusInactive")}</MenuItem>
        </TextField>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "flex-end", width: { xs: "100%", sm: "auto" } }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {t("toolbar.add")}
        </Button>
      </Box>
    </Stack>
  );
}
