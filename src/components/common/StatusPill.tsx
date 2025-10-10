import { Chip } from "@mui/material";

export default function StatusPill({ status }: { status: string }) {
  const color =
    status === "Delivered"
      ? "success"
      : status === "Active"
      ? "info"
      : status === "Canceled"
      ? "error"
      : "default";

  return <Chip label={status} color={color as any} size="small" sx={{ fontWeight: 500 }} />;
}
