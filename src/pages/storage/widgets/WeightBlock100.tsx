import { Box, Typography } from "@mui/material";
import type { ShelfItem } from "@/api/shelfApi";

type Props = {
  shelves: ShelfItem[];
  onOpenShelf?: (shelfCode: string) => void;
};

export default function MapShelves({ shelves, onOpenShelf }: Props) {
  const items = shelves ?? [];

  const pairObjects: { left?: ShelfItem; right?: ShelfItem }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairObjects.push({ left: items[i], right: items[i + 1] });
  }

  const cols = 3;

  const columns: typeof pairObjects[] = Array.from({ length: cols }, () => []);
  pairObjects.forEach((p, i) => {
    columns[i % cols].push(p);
  });

  const labelFor = (s?: ShelfItem, fallbackIndex?: number) => {
    if (!s) return "";
    const code = s.shelfCode ?? `#${fallbackIndex ?? "?"}`;
    return code.replace(/^.*-/, "");
  };

  return (
    <Box>
      <Typography fontWeight={700} fontSize={13} mb={0.6}>
        SHELFS ({items.length})
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 0.5,
          alignItems: "start",
          ml:7,
          mt:5
        }}
      >
        {columns.map((col, colIndex) => (
          <Box key={colIndex} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {col.map((pair, rowIndex) => {
              const globalPairIndex = colIndex + rowIndex * cols;
              const leftLabel = labelFor(pair.left, globalPairIndex * 2 + 1);
              const rightLabel = labelFor(pair.right, globalPairIndex * 2 + 2);

              return (
                <Box
                  key={`${colIndex}-${rowIndex}`}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    px: 1.2,
                    py: 0.6,
                    borderRadius: 1,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
                    bgcolor: (theme) => theme.palette.mode === "light" ? "hsl(210,90%,98%)" : "rgba(255,255,255,0.02)",
                    cursor: "default",
                    userSelect: "none",
                  }}
                >
                  <Box
                    onClick={() => pair.left && onOpenShelf?.(pair.left.shelfCode!)}
                    title={pair.left?.shelfCode}
                    sx={{
                      width: 50,
                      height: 30,
                      borderRadius: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: pair.left ? "pointer" : "default",
                      bgcolor: () =>
                        pair.left
                          ? `hsl(${200 + (colIndex % 6) * 10}, 85%, ${95 - (rowIndex % 5) * 4}%)`
                          : "transparent",
                      transition: "transform 120ms, box-shadow 120ms",
                      "&:hover": pair.left
                        ? { transform: "scale(1.06)", boxShadow: "0 3px 8px rgba(0,0,0,0.08)" }
                        : {},
                    }}
                  >
                    {leftLabel}
                  </Box>

                  <Box
                    onClick={() => pair.right && onOpenShelf?.(pair.right.shelfCode!)}
                    title={pair.right?.shelfCode}
                    sx={{
                      width: 50,
                      height: 30,
                      borderRadius: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: pair.right ? "pointer" : "default",
                      bgcolor: () =>
                        pair.right
                          ? `hsl(${230 + (colIndex % 6) * 8}, 80%, ${95 - (rowIndex % 5) * 4}%)`
                          : "transparent",
                      transition: "transform 120ms, box-shadow 120ms",
                      "&:hover": pair.right
                        ? { transform: "scale(1.06)", boxShadow: "0 3px 8px rgba(0,0,0,0.08)" }
                        : {},
                    }}
                  >
                    {rightLabel}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
