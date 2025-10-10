import { Box, Typography, Dialog } from "@mui/material";
import { useState } from "react";
import ShelfDialog from "./ShelfDialog";

export default function WeightBlock100() {
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);

  const shelves = Array.from({ length: 24 }); // 24 kệ

  return (
    <Box mb={2}>
      <Typography fontWeight={600} fontSize={13} mb={0.6}>
        SHELFS
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {shelves.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 40,
              height: 30,
              borderRadius: 1,
              bgcolor: `hsl(210, 90%, ${95 - (i % 8) * 5}%)`,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": {
                transform: "scale(1.06)",
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              },
            }}
            onClick={() => setSelectedShelf(i)}
          />
        ))}
      </Box>

      <Dialog
        open={selectedShelf !== null}
        onClose={() => setSelectedShelf(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedShelf !== null && (
          <ShelfDialog
            shelfId={selectedShelf}
            onClose={() => setSelectedShelf(null)}
          />
        )}
      </Dialog>
    </Box>
  );
}
