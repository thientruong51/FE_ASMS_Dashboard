import { Box, Typography } from "@mui/material";

export default function WeightBlock200() {
  const blocks = Array.from({ length: 24 });

  return (
    <Box>
      <Typography fontWeight={600} fontSize={13} mb={0.6}>
        200 KG
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {blocks.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 40,
              height: 30,
              borderRadius: 1,
              bgcolor: `hsl(260, 70%, ${90 - (i % 8) * 5}%)`,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": {
                transform: "scale(1.06)",
                boxShadow: "0 0 4px rgba(0,0,0,0.25)",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
