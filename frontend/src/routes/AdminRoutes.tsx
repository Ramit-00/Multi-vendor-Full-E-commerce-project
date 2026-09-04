import { Route, Routes } from "react-router-dom";
import AdminOverviewDashboard from "../admin/pages/Dashboard/AdminOverviewDashboard";
import UsersTable from "../admin/pages/Users/UsersTable";
import SellersTable from "../admin/pages/sellers/SellersTable";
import AdminProductsTable from "../admin/pages/Products/AdminProductsTable";
import AdminTransactionsTable from "../admin/pages/Transactions/AdminTransactionsTable";
import Coupon from "../admin/pages/Coupon/Coupon";
import CouponForm from "../admin/pages/Coupon/CreateCouponForm";
import GridTable from "../admin/pages/Home Page/GridTable";
import ElectronicsTable from "../admin/pages/Home Page/ElectronicsTable";
import ShopByCategoryTable from "../admin/pages/Home Page/ShopByCategoryTable";
import Deal from "../admin/pages/Home Page/Deal";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminOverviewDashboard />} />
      <Route path="/users" element={<UsersTable />} />
      <Route path="/sellers" element={<SellersTable />} />
      <Route path="/products" element={<AdminProductsTable />} />
      <Route path="/transactions" element={<AdminTransactionsTable />} />
      <Route path="/coupon" element={<Coupon />} />
      <Route path="/add-coupon" element={<CouponForm />} />
      <Route path="/home-grid" element={<GridTable />} />
      <Route path="/electronics-category" element={<ElectronicsTable />} />
      <Route path="/shop-by-category" element={<ShopByCategoryTable />} />
      <Route path="/deals" element={<Deal />} />
    </Routes>
  );
};

export default AdminRoutes;