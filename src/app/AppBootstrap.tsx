import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { bootstrapSidebarData } from "@/app/bootstrapSidebarData";

export default function AppBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    bootstrapSidebarData(dispatch);
  }, [dispatch]);
useEffect(() => {
  bootstrapSidebarData(dispatch);

  const interval = setInterval(() => {
    bootstrapSidebarData(dispatch);
  }, 30000);

  return () => clearInterval(interval);
}, []);
  return null; 
}
