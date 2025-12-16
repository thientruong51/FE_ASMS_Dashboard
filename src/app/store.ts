import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/features/ui/uiSlice";
import ordersReducer from "@/features/orders/ordersSlice";
import contactReducer from "../features/contact/contactSlice";
import trackingReducer from "@/features/tracking/trackingSlice";
import storageReducer from "@/features/storage/storageSlice";
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    order: ordersReducer,
    contact: contactReducer,
    tracking: trackingReducer,
    storage: storageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
