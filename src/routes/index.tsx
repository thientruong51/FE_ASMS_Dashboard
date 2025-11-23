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
import ServicePage from "@/pages/service/ServicePage";
import ProductTypePage from "@/pages/product-type/ProductTypePage";
import EmployeeRolePage from "@/pages/employee-role/EmployeeRolePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
    { path: "storage", element: <StoragePage /> },
    { path: "employee-roles", element: <EmployeeRolePage /> },
    { path: "staffs", element: <StaffPage /> },
    { path: "customers", element: <CustomerPage /> },
    { path: "shelfs", element: <ShelfPage /> },
    { path: "buildings", element: <BuildingPage /> },
    { path: "container-types", element: <ContainerTypePage /> },
    { path: "storage-types", element: <StorageTypePage /> },
    { path: "services", element: <ServicePage /> },
    { path: "product-types", element: <ProductTypePage /> },
    ],
  },
]);
