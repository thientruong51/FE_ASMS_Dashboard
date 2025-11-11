import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import StoragePage from "@/pages/storage/StoragePage";
import StaffPage from "../pages/staff/StaffPage";
import CustomerPage from "@/pages/customer/CustomerPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
    { path: "storage", element: <StoragePage /> },
    { path: "staffs", element: <StaffPage /> },
    { path: "customers", element: <CustomerPage /> },
    ],
  },
]);
