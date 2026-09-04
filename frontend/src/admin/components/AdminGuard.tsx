import React from "react";
import { Navigate } from "react-router-dom";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const adminJwt = localStorage.getItem("admin_jwt");
  const role = localStorage.getItem("role");

  if (!adminJwt || role !== "ROLE_ADMIN") {
    // Silently redirect to marketplace homepage without revealing portal existence
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
