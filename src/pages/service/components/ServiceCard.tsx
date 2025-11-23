import { Paper, Box, Typography, Stack, Button, Divider } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import type { Service } from "../../../api/serviceApi";


const PACKAGE_COLOR_THEME = {
  basic: { hex: "#10B981", textContrast: "#fff" }, 
  business: { hex: "#F59E0B", textContrast: "#000" }, 
  premium: { hex: "#8B5CF6", textContrast: "#fff" }, 
};

const PACKAGE_KEYWORDS: Record<string, string[]> = {
  basic: ["basic"],
  business: ["business"],
  premium: ["premium"],
};


const ADDON_COLOR_THEME: Record<string, { hex: string; textContrast?: string }> = {
  shipping: { hex: "#06B6D4", textContrast: "#fff" }, 
  protecting: { hex: "#06B6D4", textContrast: "#fff" },
  packaging: { hex: "#F97316", textContrast: "#fff" }, 
  delivery: { hex: "#059669", textContrast: "#fff" }, 
  default: { hex: "#10B981", textContrast: "#fff" }, 
};

const ADDON_KEYWORDS: Record<string, string[]> = {
  shipping: ["shipping", "ship"],
  protecting: ["protect", "protecting", "protection"],
  packaging: ["pack", "packaging", "packaging"],
  delivery: ["delivery", "deliver"],
};

function findAddonGroup(name: string): string | null {
  const n = name.toLowerCase();
  for (const group of Object.keys(ADDON_KEYWORDS)) {
    const kws = ADDON_KEYWORDS[group] as string[];
    for (const kw of kws) {
      if (n.includes(kw)) return group;
    }
  }
  return null;
}


function pickPalette(item: Service) {
  const name = (item.name ?? "").toLowerCase();

  if (item.serviceId >= 5) {
    if (PACKAGE_KEYWORDS.basic.some((kw) => name.includes(kw))) {
      const c = PACKAGE_COLOR_THEME.basic;
      return { color: c.hex, border: `${c.hex}33`, textContrast: c.textContrast, highlighted: true, type: "package" };
    }
    if (PACKAGE_KEYWORDS.business.some((kw) => name.includes(kw))) {
      const c = PACKAGE_COLOR_THEME.business;
      return { color: c.hex, border: `${c.hex}33`, textContrast: c.textContrast, highlighted: true, type: "package" };
    }
    if (PACKAGE_KEYWORDS.premium.some((kw) => name.includes(kw))) {
      const c = PACKAGE_COLOR_THEME.premium;
      return { color: c.hex, border: `${c.hex}33`, textContrast: c.textContrast, highlighted: true, type: "package" };
    }
    const fb = PACKAGE_COLOR_THEME.basic;
    return { color: fb.hex, border: `${fb.hex}22`, textContrast: fb.textContrast, highlighted: true, type: "package" };
  }

  if (item.serviceId >= 1 && item.serviceId <= 4) {
    const group = findAddonGroup(name);
    const picked = group ? ADDON_COLOR_THEME[group] : ADDON_COLOR_THEME.default;
    return {
      color: picked.hex,
      border: `${picked.hex}22`,
      textContrast: picked.textContrast ?? "#fff",
      highlighted: false,
      type: "addon",
    };
  }

  return { color: "#6B7280", border: "#e5e7eb", textContrast: "#fff", highlighted: false, type: "generic" };
}


export default function ServiceCard({ item, onEdit }: { item: Service; onEdit: (s: Service) => void }) {
  const palette = pickPalette(item);

  const features = (item.description ?? "")
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceLabel = item.price && item.price > 0 ? `${Number(item.price).toLocaleString()} VND` : "Contact us";

  const isAddon = palette.type === "addon";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        minWidth: 240,
        maxWidth: 360,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `2px solid ${palette.border}`,
        backgroundColor: "white",
        transition: "all 0.22s cubic-bezier(.12,.62,.4,.92)",
        cursor: "pointer",

        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 30px ${palette.color}33`,
          borderColor: palette.color,
        },
      }}
    >
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: palette.color,
            fontWeight: 700,
            letterSpacing: ".5px",
          }}
        >
          {isAddon ? "ADD-ON" : "PACKAGE"}
        </Typography>

        <Typography variant="h6" sx={{ mt: 1, fontWeight: 900 }}>
          {item.name}
        </Typography>

        {features.length <= 1 && item.description && (
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 13 }}>
            {item.description}
          </Typography>
        )}

        <Divider sx={{ my: 2, opacity: 0.1 }} />

        <Typography variant="h6" sx={{ fontSize: 16, opacity: 0.7 }}>
          Price:
        </Typography>

        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 26 }}>
            {priceLabel}
          </Typography>

          {features.length > 1 && (
            <Box>
              {features.map((f, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                  <CheckIcon sx={{ fontSize: 18, color: palette.color, transition: "0.18s" }} />
                  <Typography variant="body2" color="text.secondary">
                    {f}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      {/* Button */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Button
          startIcon={<EditIcon />}
          onClick={() => onEdit(item)}
          variant={palette.highlighted ? "contained" : "outlined"}
          sx={{
            textTransform: "none",
            borderRadius: 6,
            px: 4,
            py: 1.2,
            fontWeight: 600,
            bgcolor: palette.highlighted ? palette.color : "transparent",
            borderColor: palette.color,
            color: palette.highlighted ? palette.textContrast : palette.color,
            transition: "all .22s ease",
            "&:hover": {
              bgcolor: palette.highlighted ? palette.color : `${palette.color}15`,
              borderColor: palette.color,
            },
          }}
        >
          Edit
        </Button>
      </Box>
    </Paper>
  );
}
