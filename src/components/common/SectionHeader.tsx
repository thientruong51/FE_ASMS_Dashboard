import { Box, Typography, Link } from "@mui/material";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionLabel = "View All", onAction }: Props) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
      <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
      <Link component="button" variant="body2" onClick={onAction}>
        {actionLabel}
      </Link>
    </Box>
  );
}
