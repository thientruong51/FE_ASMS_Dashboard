import { useTheme, useMediaQuery } from "@mui/material";

export function useResponsive(
  query: "up" | "down",
  key: "xs" | "sm" | "md" | "lg" | "xl"
) {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints[query](key));
  return matches;
}
