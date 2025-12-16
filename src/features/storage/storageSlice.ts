import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type StorageState = {
  pendingCount: number;
};

const initialState: StorageState = {
  pendingCount: 0,
};

const storageSlice = createSlice({
  name: "storage",
  initialState,
  reducers: {
    setPendingStorageCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
    clearPendingStorageCount(state) {
      state.pendingCount = 0;
    },
  },
});

export const {
  setPendingStorageCount,
  clearPendingStorageCount,
} = storageSlice.actions;

export default storageSlice.reducer;
