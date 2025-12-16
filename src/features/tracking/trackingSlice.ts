import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type TrackingState = {
  pendingCount: number;
};

const initialState: TrackingState = {
  pendingCount: 0,
};

const trackingSlice = createSlice({
  name: "tracking",
  initialState,
  reducers: {
    setPendingTrackingCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
    clearPendingTrackingCount(state) {
      state.pendingCount = 0;
    },
  },
});

export const {
  setPendingTrackingCount,
  clearPendingTrackingCount,
} = trackingSlice.actions;

export default trackingSlice.reducer;
