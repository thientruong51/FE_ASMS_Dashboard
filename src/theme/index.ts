import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";


declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    mobile: true; 
  }
}

export const theme = createTheme({
  breakpoints: {
    values: { mobile: 375, xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  spacing: 8,
  shape: { borderRadius: 10 },
  palette,
  typography: {
    fontFamily: "Inter, Roboto, sans-serif",
    h6: { fontWeight: 600 },
    subtitle1: { fontSize: 15, fontWeight: 600 },
    body2: { fontSize: 13 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          transition: "all 0.2s ease",
          "@media (max-width:375px)": {
            marginBottom: 8,
          },
        },
      },
    },
  },
});
