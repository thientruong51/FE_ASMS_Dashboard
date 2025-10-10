import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { theme } from "@/theme";
import { router } from "@/routes";
import { useAutoUIMode } from "@/hooks/useAutoUIMode";

import { Provider } from "react-redux";
import { store } from "@/app/store";

export default function App() {
  useAutoUIMode(); 

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
}
