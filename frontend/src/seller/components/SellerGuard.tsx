import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../Redux Toolkit/Store";

interface SellerGuardProps {
  children: React.ReactNode;
}

const SellerGuard: React.FC<SellerGuardProps> = ({ children }) => {
  const { jwt: reduxSellerJwt } = useAppSelector((state) => state.sellerAuth);
  const sellerJwt = reduxSellerJwt || localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");
  const sellerRole = localStorage.getItem("seller_role") || localStorage.getItem("role");

  const isSellerRole = sellerRole === "ROLE_SELLER" || sellerRole === "SELLER";

  if (!sellerJwt || !isSellerRole) {
    return <Navigate to="/become-seller" replace />;
  }

  return <>{children}</>;
};

export default SellerGuard;
