import './App.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import customeTheme from './Theme/customeTheme';

import { Route, Routes, useNavigate } from 'react-router-dom';

import SellerDashboard from './seller/pages/SellerDashboard/SellerDashboard';
import CustomerRoutes from './routes/CustomerRoutes';
import AdminDashboard from './admin/pages/Dashboard/Dashboard';
import SellerAccountVerification from './seller/pages/SellerAccountVerification';
import SellerAccountVerified from './seller/pages/SellerAccountVerified';
import { useAppDispatch, useAppSelector } from './Redux Toolkit/Store';
import { useEffect } from 'react';
import { fetchSellerProfile } from './Redux Toolkit/Seller/sellerSlice';
import BecomeSeller from './customer/pages/BecomeSeller/BecomeSeller';
import AdminAuth from './admin/pages/Auth/AdminAuth';
import { fetchUserProfile } from './Redux Toolkit/Customer/UserSlice';
import { createHomeCategories } from './Redux Toolkit/Customer/Customer/AsyncThunk';
import { homeCategories } from './data/homeCategories';

function App() {
  const dispatch = useAppDispatch()
  const { auth, sellerAuth, user } = useAppSelector(store => store)
const navigate=useNavigate();

  useEffect(() => {
    const activeRole = localStorage.getItem("role");
    const sellerJwt = localStorage.getItem("seller_jwt");
    const customerJwt = localStorage.getItem("customer_jwt") || localStorage.getItem("jwt");

    if (activeRole === "ROLE_SELLER" || sellerJwt) {
      dispatch(fetchSellerProfile(sellerJwt || customerJwt || ""));
    } else if (customerJwt) {
      dispatch(fetchUserProfile({ jwt: customerJwt, navigate }));
    }
  }, [auth.jwt, sellerAuth.jwt, dispatch, navigate]);

  useEffect(() => {
    dispatch(createHomeCategories(homeCategories))
    // dispatch(fetchHomePageData())
  }, [dispatch])

  return (
    <ThemeProvider theme={customeTheme}>
      <CssBaseline />
      <div className='App' >


        <Routes>
          <Route path='/seller/*' element={<SellerDashboard />} />
          {user.user?.role === "ROLE_ADMIN" && <Route path='/admin/*' element={<AdminDashboard />} />}
          <Route path='/verify-seller/:otp' element={<SellerAccountVerification />} />
          <Route path='/seller-account-verified' element={<SellerAccountVerified />} />
          <Route path='/become-seller' element={<BecomeSeller />} />
          <Route path='/admin-login' element={<AdminAuth />} />

          <Route path='*' element={<CustomerRoutes />} />

        </Routes>
        {/* <Footer/> */}
      </div>



    </ThemeProvider>
  );
}

export default App;
