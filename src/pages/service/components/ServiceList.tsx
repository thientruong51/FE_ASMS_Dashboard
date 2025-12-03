import { Box } from "@mui/material";
import ServiceCard from "./ServiceCard";
import type { Service } from "../../../api/serviceApi";

export default function ServiceList({
  list,
  onEdit
}: {
  list: Service[];
  onEdit: (s: Service) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        justifyContent: list.length <= 2 ? "center" : "flex-start"
      }}
    >
      {list.map((s) => (
        <Box
          key={s.serviceId}
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 24px)",
              md: "1 1 calc(33.33% - 24px)",
              lg: "1 1 calc(25% - 24px)"
            },
            minWidth: 270,
            maxWidth: 270
          }}
        >
          <ServiceCard item={s} onEdit={onEdit} />
        </Box>
      ))}
    </Box>
  );
}
