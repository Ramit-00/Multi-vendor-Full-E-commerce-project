import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../Redux Toolkit/Store";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { adminJwt: reduxAdminJwt } = useAppSelector((state) => state.adminPlatform);
  const adminJwt = reduxAdminJwt || localStorage.getItem("admin_jwt");
  const role = localStorage.getItem("role");

  if (!adminJwt || role !== "ROLE_ADMIN") {
    // Silently redirect to marketplace homepage without revealing portal existence
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
