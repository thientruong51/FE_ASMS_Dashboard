import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ContactCounterState = {
  contactCount: number;   
  supportCount: number;   
};

const initialState: ContactCounterState = {
  contactCount: 0,
  supportCount: 0,
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    setContactCounters(
      state,
      action: PayloadAction<{ contact: number; support: number }>
    ) {
      state.contactCount = action.payload.contact;
      state.supportCount = action.payload.support;
    },
    clearContactCounters(state) {
      state.contactCount = 0;
      state.supportCount = 0;
    },
  },
});

export const {
  setContactCounters,
  clearContactCounters,
} = contactSlice.actions;

export default contactSlice.reducer;
