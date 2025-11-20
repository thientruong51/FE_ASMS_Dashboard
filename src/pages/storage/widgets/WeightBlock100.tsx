import { Box, Typography } from "@mui/material";
import type { ShelfItem } from "@/api/shelfApi";

type Props = {
  shelves: ShelfItem[];
  onOpenShelf?: (shelfCode: string) => void;
};

export default function WeightBlock100({ shelves, onOpenShelf }: Props) {
  const items = shelves && shelves.length > 0 ? shelves : [];

  return (
    <Box mb={2}>
      <Typography fontWeight={600} fontSize={13} mb={0.6}>
        SHELFS ({items.length})
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {items.map((s, i) => {
          const label = s.shelfCode ?? `#${i + 1}`;
          return (
            <Box
              key={label + i}
              title={label}
              sx={{
                width: 40,
                height: 30,
                borderRadius: 1,
                bgcolor: `hsl(210, 90%, ${95 - (i % 8) * 5}%)`,
                cursor: "pointer",
                transition: "0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                userSelect: "none",
                "&:hover": {
                  transform: "scale(1.06)",
                  boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                },
              }}
              onClick={() => onOpenShelf?.(s.shelfCode!)}
            >
              {label.replace(/^.*-/, "")}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
