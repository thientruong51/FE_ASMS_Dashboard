import { useEffect } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useAppDispatch } from "@/app/hooks";
import { setUIMode } from "@/features/ui/uiSlice";

/**
 * Tự động đổi uiMode dựa theo breakpoints
 */
export function useAutoUIMode() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  useEffect(() => {
    if (isMobile) dispatch(setUIMode("mobile"));
    else if (isTablet) dispatch(setUIMode("aspect"));
    else if (isDesktop) dispatch(setUIMode("desktop"));
  }, [isMobile, isTablet, isDesktop, dispatch]);
}
