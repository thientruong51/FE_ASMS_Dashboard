import { Box } from "@mui/material";
import ShelfCard from "./ShelfCard";
import type { ShelfType } from "./types";

export default function ShelfList({
  list,
  onEdit,
  onDelete,
}: {
  list: ShelfType[];
  onEdit: (s: ShelfType) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: list.length <= 2 ? "center" : "flex-start" }}>
      {list.map((shelf) => (
        <Box
          key={shelf.shelfTypeId}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", md: "1 1 calc(33.333% - 16px)" },
            minWidth: 280,
            maxWidth: 420,
          }}
        >
          <ShelfCard shelf={shelf} onEdit={onEdit} onDelete={onDelete} />
        </Box>
      ))}
    </Box>
  );
}
