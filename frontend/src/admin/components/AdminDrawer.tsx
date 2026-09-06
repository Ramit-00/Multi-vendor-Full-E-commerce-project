import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import { adminLogout } from "../../Redux Toolkit/Admin/AdminPlatformSlice";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import { Category } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import Divider from "@mui/material/Divider";

const menuItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: <DashboardIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Customer Accounts",
    path: "/admin/users",
    icon: <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Sellers & Earnings",
    path: "/admin/sellers",
    icon: <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Products Catalog",
    path: "/admin/products",
    icon: <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Transactions Ledger",
    path: "/admin/transactions",
    icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Coupons",
    path: "/admin/coupon",
    icon: <IntegrationInstructionsIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Add New Coupon",
    path: "/admin/add-coupon",
    icon: <AddIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Deals & Offers",
    path: "/admin/deals",
    icon: <LocalOfferIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Home Page Grid",
    path: "/admin/home-grid",
    icon: <HomeIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Electronics Category",
    path: "/admin/electronics-category",
    icon: <ElectricBoltIcon sx={{ fontSize: 20 }} />,
  },
  {
    name: "Shop By Category",
    path: "/admin/shop-by-category",
    icon: <Category sx={{ fontSize: 20 }} />,
  },
];

interface AdminDrawerProps {
  toggleDrawer?: any;
}

const AdminDrawer: React.FC<AdminDrawerProps> = ({ toggleDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleNav = (path: string) => {
    navigate(path);
    if (toggleDrawer) toggleDrawer(false)();
  };

  const handleSignOut = () => {
    dispatch(adminLogout());
    navigate("/");
    if (toggleDrawer) toggleDrawer(false)();
  };

  return (
    <div className="h-full bg-slate-950 text-slate-300 w-[270px] border-r border-slate-800 flex flex-col justify-between py-6 select-none">
      {/* Top Section: Navigation Items */}
      <div className="overflow-y-auto px-3 space-y-1">
        <div className="px-3 pb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            Platform Management
          </p>
        </div>

        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/admin" && location.pathname === "/admin/");
          return (
            <div
              key={item.name}
              onClick={() => handleNav(item.path)}
              className="cursor-pointer"
            >
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                }`}
              >
                <span className={isActive ? "text-white" : "text-slate-500"}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Storefront & Sign Out */}
      <div className="px-3 pt-4 space-y-2">
        <Divider sx={{ borderColor: "#1E293B", mx: 1 }} />

        <div
          onClick={() => handleNav("/")}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
        >
          <StorefrontOutlinedIcon sx={{ fontSize: 20, color: "#64748B" }} />
          <span>Marketplace Storefront</span>
        </div>

        <div
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 cursor-pointer transition-colors"
        >
          <LogoutIcon sx={{ fontSize: 20, color: "#F87171" }} />
          <span>Terminate Session</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDrawer;
