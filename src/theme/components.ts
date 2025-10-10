import type { Components, Theme } from "@mui/material/styles";

export const components: Components<Theme> = {
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none" as const, 
      },
    },
  },
};
