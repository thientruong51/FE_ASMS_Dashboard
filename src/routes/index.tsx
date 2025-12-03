import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

import LoginPage from "@/pages/auth/LoginPage";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import StoragePage from "@/pages/storage/StoragePage";
import StaffPage from "@/pages/staff/StaffPage";
import CustomerPage from "@/pages/customer/CustomerPage";
import ShelfPage from "@/pages/shelf/ShelfPage";
import BuildingPage from "@/pages/building/BuildingPage";
import ContainerTypePage from "@/pages/container-type/ContainerTypePage";
import StorageTypePage from "@/pages/storage-type/StorageTypePage";
import ServicePage from "@/pages/service/ServicePage";
import ProductTypePage from "@/pages/product-type/ProductTypePage";
import EmployeeRolePage from "@/pages/employee-role/EmployeeRolePage";
import OrderPage from "@/pages/order/OrderPage";
import TrackingHistoryPage from "@/pages/trackingHistory/TrackingHistoryPage";
import PaymentHistoryPage from "@/pages/paymentHistory/PaymentHistoryPage";
import SettingsPage from "@/pages/setting/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },

  {
    element: <ProtectedRoute />, 
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "orders", element: <OrderPage /> },
          { path: "trackingHistorys", element: <TrackingHistoryPage /> },
          { path: "paymentHistorys", element: <PaymentHistoryPage /> },
          { path: "storages", element: <StoragePage /> },
          { path: "employee-roles", element: <EmployeeRolePage /> },
          { path: "staffs", element: <StaffPage /> },
          { path: "customers", element: <CustomerPage /> },
          { path: "shelfs", element: <ShelfPage /> },
          { path: "buildings", element: <BuildingPage /> },
          { path: "container-types", element: <ContainerTypePage /> },
          { path: "storage-types", element: <StorageTypePage /> },
          { path: "services", element: <ServicePage /> },
          { path: "product-types", element: <ProductTypePage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
