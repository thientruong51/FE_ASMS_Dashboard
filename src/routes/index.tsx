import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

import LoginPage from "@/pages/auth/LoginPage";
import UnauthorizedPage from "@/pages/unauthorized/UnauthorizedPage";

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
import ContactPage from "@/pages/contact/ContactPage";
import PricePage from "@/pages/price/PricePage";
import BusinessRulesPage from "@/pages/businessRule/BusinessRulesPage";

const ALL = [1, 2, 3, 4];
const ROLE_4 = [4];

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
          { index: true, element: <ProtectedRoute allowedRoles={ALL}><DashboardPage /></ProtectedRoute> },

          { path: "orders", element: <ProtectedRoute allowedRoles={ALL}><OrderPage /></ProtectedRoute> },

          { path: "trackingHistorys", element: <ProtectedRoute allowedRoles={ALL}><TrackingHistoryPage /></ProtectedRoute> },

          { path: "contacts", element: <ProtectedRoute allowedRoles={ALL}><ContactPage /></ProtectedRoute> },

          { path: "paymentHistorys", element: <ProtectedRoute allowedRoles={[1,4]}><PaymentHistoryPage /></ProtectedRoute> },

          { path: "storages", element: <ProtectedRoute allowedRoles={ALL}><StoragePage /></ProtectedRoute> },

          { path: "employee-roles", element: <ProtectedRoute allowedRoles={ROLE_4}><EmployeeRolePage /></ProtectedRoute> },

          { path: "staffs", element: <ProtectedRoute allowedRoles={[1,4]}><StaffPage /></ProtectedRoute> },

          { path: "customers", element: <ProtectedRoute allowedRoles={[1,4]}><CustomerPage /></ProtectedRoute> },

          { path: "shelfs", element: <ProtectedRoute allowedRoles={[1,4]}><ShelfPage /></ProtectedRoute> },

          { path: "buildings", element: <ProtectedRoute allowedRoles={ROLE_4}><BuildingPage /></ProtectedRoute> },

          { path: "container-types", element: <ProtectedRoute allowedRoles={ROLE_4}><ContainerTypePage /></ProtectedRoute> },

          { path: "storage-types", element: <ProtectedRoute allowedRoles={ROLE_4}><StorageTypePage /></ProtectedRoute> },

          { path: "services", element: <ProtectedRoute allowedRoles={[1,4]}><ServicePage /></ProtectedRoute> },

          { path: "product-types", element: <ProtectedRoute allowedRoles={ROLE_4}><ProductTypePage /></ProtectedRoute> },

          { path: "prices", element: <ProtectedRoute allowedRoles={[1,4]}><PricePage /></ProtectedRoute> },

          { path: "businessRules", element: <ProtectedRoute allowedRoles={[1,4]}><BusinessRulesPage /></ProtectedRoute> },

          { path: "settings", element: <ProtectedRoute allowedRoles={ALL}><SettingsPage /></ProtectedRoute> },
        ],
      },
    ],
  },

  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
]);
