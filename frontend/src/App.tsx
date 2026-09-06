import './App.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import customeTheme from './Theme/customeTheme';

import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

import SellerDashboard from './seller/pages/SellerDashboard/SellerDashboard';
import CustomerRoutes from './routes/CustomerRoutes';
import AdminDashboard from './admin/pages/Dashboard/Dashboard';
import SellerAccountVerification from './seller/pages/SellerAccountVerification';
import SellerAccountVerified from './seller/pages/SellerAccountVerified';
import { useAppDispatch, useAppSelector } from './Redux Toolkit/Store';
import { useEffect } from 'react';
import { fetchSellerProfile } from './Redux Toolkit/Seller/sellerSlice';
import BecomeSeller from './customer/pages/BecomeSeller/BecomeSeller';
import AdminSecretGate from './admin/pages/Auth/AdminSecretGate';
import AdminGuard from './admin/components/AdminGuard';
import { fetchUserProfile } from './Redux Toolkit/Customer/UserSlice';
import { createHomeCategories } from './Redux Toolkit/Customer/Customer/AsyncThunk';
import { homeCategories } from './data/homeCategories';

function App() {
  const dispatch = useAppDispatch();
  const { auth, sellerAuth } = useAppSelector((store) => store);

  useEffect(() => {
    const activeRole = localStorage.getItem("role");
    const adminJwt = localStorage.getItem("admin_jwt");
    const sellerJwt = localStorage.getItem("seller_jwt");
    const customerJwt = localStorage.getItem("customer_jwt") || localStorage.getItem("jwt");

    // Strictly isolate Admin sessions: do NOT fetch seller profile or customer profile
    if (activeRole === "ROLE_ADMIN" || adminJwt) {
      return;
    }

    if (activeRole === "ROLE_SELLER" || sellerJwt) {
      dispatch(fetchSellerProfile(sellerJwt || customerJwt || ""));
    } else if (customerJwt) {
      dispatch(fetchUserProfile({ jwt: customerJwt }));
    }
  }, [auth.jwt, sellerAuth.jwt, dispatch]);

  useEffect(() => {
    dispatch(createHomeCategories(homeCategories));
  }, [dispatch]);

  return (
    <ThemeProvider theme={customeTheme}>
      <CssBaseline />
      <ScrollToTop />
      <div className="App">
        <Routes>
          {/* Seller Portal */}
          <Route path="/seller/*" element={<SellerDashboard />} />
          <Route path="/verify-seller/:otp" element={<SellerAccountVerification />} />
          <Route path="/seller-account-verified" element={<SellerAccountVerified />} />
          <Route path="/become-seller" element={<BecomeSeller />} />

          {/* High-Security Admin Hidden Gateway (Master Key Protected) */}
          <Route path="/system-control-vault" element={<AdminSecretGate />} />

          {/* Protected Admin Console */}
          <Route
            path="/admin/*"
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            }
          />

          {/* Customer & Marketplace Public Routes */}
          <Route path="*" element={<CustomerRoutes />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
