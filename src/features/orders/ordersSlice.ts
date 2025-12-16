import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type OrderState = {
  pendingCount: number;
};

const initialState: OrderState = {
  pendingCount: 0,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setPendingOrderCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
    clearPendingOrderCount(state) {
      state.pendingCount = 0;
    },
  },
});

export const {
  setPendingOrderCount,
  clearPendingOrderCount,
} = orderSlice.actions;

export default orderSlice.reducer;
