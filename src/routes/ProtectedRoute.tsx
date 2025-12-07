import { Navigate, Outlet } from "react-router-dom";
import { getAuthClaimsFromStorage } from "@/utils/auth";

interface ProtectedRouteProps {
  allowedRoles?: number[];
  children?: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const claims = getAuthClaimsFromStorage();
  const token = localStorage.getItem("accessToken");

  if (!token || !claims) {
    return <Navigate to="/login" replace />;
  }

  const roleId = claims.EmployeeRoleId ? Number(claims.EmployeeRoleId) : null;

  if (allowedRoles && (roleId === null || !allowedRoles.includes(roleId))) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (children) return <>{children}</>;

  return <Outlet />;
}
