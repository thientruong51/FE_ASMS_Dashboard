import { Paper, Box, Typography, Divider, Stack, Button } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import type { ProductTypeItem } from "@/api/productTypeApi";

const DEFAULT_COLOR = "#10B981";

export default function ProductTypeCard({
  item,
  onEdit,
}: {
  item: ProductTypeItem;
  onEdit: (p: ProductTypeItem) => void;
}) {
  const { t } = useTranslation("productTypePage");

  const features = (item.description ?? "")
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        minWidth: 260,
        maxWidth: 260,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `2px solid #eef2ff`,
        backgroundColor: "white",
        transition: "all 0.22s cubic-bezier(.12,.62,.4,.92)",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 30px ${DEFAULT_COLOR}22`,
          borderColor: DEFAULT_COLOR,
        },
      }}
      onClick={() => onEdit(item)}
    >
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: DEFAULT_COLOR,
            fontWeight: 700,
            letterSpacing: ".5px",
          }}
        >
          {t("productTypeLabel")}
        </Typography>

        <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
          {item.name}
        </Typography>

        {features.length <= 1 && item.description && (
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 13 }}>
            {item.description}
          </Typography>
        )}

        <Divider sx={{ my: 2, opacity: 0.1 }} />

        <Stack spacing={1}>
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t("flagsLabel")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.isFragile ? t("fragile") : t("notFragile")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.canStack ? t("canStack") : t("noStack")}
            </Typography>
          </Box>

          {features.length > 1 && (
            <Box>
              {features.map((f, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                  <CheckIcon sx={{ fontSize: 18, color: DEFAULT_COLOR, transition: "0.18s" }} />
                  <Typography variant="body2" color="text.secondary">
                    {f}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Button
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          variant="contained"
          sx={{
            textTransform: "none",
            borderRadius: 6,
            px: 4,
            py: 1.2,
            fontWeight: 600,
            bgcolor: DEFAULT_COLOR,
            borderColor: DEFAULT_COLOR,
            color: "#fff",
            transition: "all .22s ease",
            "&:hover": {
              bgcolor: DEFAULT_COLOR,
              borderColor: DEFAULT_COLOR,
            },
          }}
        >
          {t("edit")}
        </Button>
      </Box>
    </Paper>
  );
}
