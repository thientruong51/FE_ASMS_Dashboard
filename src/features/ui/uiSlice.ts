import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type UIMode = "mobile" | "aspect" | "desktop";

interface UIState {
  themeMode: "light" | "dark";
  sidebarOpen: boolean;
  uiMode: UIMode;
}

const initialState: UIState = {
  themeMode: "light",
  sidebarOpen: true,
  uiMode: "desktop",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.themeMode = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebar(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setUIMode(state, action: PayloadAction<UIMode>) {
      state.uiMode = action.payload;
    },
  },
});

export const { setTheme, toggleSidebar, setSidebar, setUIMode } = uiSlice.actions;
export default uiSlice.reducer;
