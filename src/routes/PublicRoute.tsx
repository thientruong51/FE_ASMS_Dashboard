import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const accessToken = localStorage.getItem("accessToken");

  // Nếu đã đăng nhập thì redirect về trang chủ
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
