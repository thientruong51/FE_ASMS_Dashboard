import { Box } from "@mui/material";
import ProductTypeCard from "./ProductTypeCard";
import type { ProductTypeItem } from "@/api/productTypeApi";

export default function ProductTypeList({
  list,
  onEdit,
}: {
  list: ProductTypeItem[];
  onEdit: (p: ProductTypeItem) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        justifyContent: list.length <= 2 ? "center" : "flex-start",
      }}
    >
      {list.map((p) => (
        <Box
          key={p.productTypeId}
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 24px)",
              md: "1 1 calc(33.33% - 24px)",
              lg: "1 1 calc(25% - 24px)",
            },
            minWidth: 260,
            maxWidth: 320,
          }}
        >
          <ProductTypeCard item={p} onEdit={onEdit} />
        </Box>
      ))}
    </Box>
  );
}
