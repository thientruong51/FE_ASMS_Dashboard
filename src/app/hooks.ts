import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux"; // <- dùng import type
import type { RootState, AppDispatch } from "./store";

// Hook chuẩn để dùng trong toàn app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
