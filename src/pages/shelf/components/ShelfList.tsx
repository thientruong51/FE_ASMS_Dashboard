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
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2,justifyContent: "center", }}>
      {list.map((shelf) => (
        <Box
          key={shelf.shelfTypeId}
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 16px)",
              md: "1 1 calc(50% - 16px)",
            },
            minWidth: 280,
            maxWidth: 400,
          }}
        >
          <ShelfCard shelf={shelf} onEdit={onEdit} onDelete={onDelete} />
        </Box>
      ))}
    </Box>
  );
}
