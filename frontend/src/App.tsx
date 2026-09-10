import React, { Suspense, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import customeTheme from './Theme/customeTheme';

import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

import CustomerRoutes from './routes/CustomerRoutes';
import { useAppDispatch, useAppSelector } from './Redux Toolkit/Store';
import { fetchSellerProfile } from './Redux Toolkit/Seller/sellerSlice';
import AdminGuard from './admin/components/AdminGuard';
import SellerGuard from './seller/components/SellerGuard';
import { fetchUserProfile } from './Redux Toolkit/Customer/UserSlice';

// Code-split heavy portals to optimize initial bundle size
const SellerDashboard = React.lazy(() => import('./seller/pages/SellerDashboard/SellerDashboard'));
const AdminDashboard = React.lazy(() => import('./admin/pages/Dashboard/Dashboard'));
const AdminSecretGate = React.lazy(() => import('./admin/pages/Auth/AdminSecretGate'));
const BecomeSeller = React.lazy(() => import('./customer/pages/BecomeSeller/BecomeSeller'));
const SellerAccountVerification = React.lazy(() => import('./seller/pages/SellerAccountVerification'));
const SellerAccountVerified = React.lazy(() => import('./seller/pages/SellerAccountVerified'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#0F172A' }} />
  </Box>
);

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

  return (
    <ThemeProvider theme={customeTheme}>
      <CssBaseline />
      <ScrollToTop />
      <div className="App">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Protected Seller Portal */}
            <Route
              path="/seller/*"
              element={
                <SellerGuard>
                  <SellerDashboard />
                </SellerGuard>
              }
            />
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
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App;
