import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import StoragePage from "@/pages/storage/StoragePage";
import StaffPage from "../pages/staff/StaffPage";
import CustomerPage from "@/pages/customer/CustomerPage";
import ShelfPage from "@/pages/shelf/ShelfPage";
import BuildingPage from "@/pages/building/BuildingPage";
import ContainerTypePage from "@/pages/container-type/ContainerTypePage";
import StorageTypePage from "@/pages/storage-type/StorageTypePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
    { path: "storage", element: <StoragePage /> },
    { path: "staffs", element: <StaffPage /> },
    { path: "customers", element: <CustomerPage /> },
    { path: "shelfs", element: <ShelfPage /> },
    { path: "buildings", element: <BuildingPage /> },
    { path: "container-types", element: <ContainerTypePage /> },
    { path: "storage-types", element: <StorageTypePage /> },
    ],
  },
]);
