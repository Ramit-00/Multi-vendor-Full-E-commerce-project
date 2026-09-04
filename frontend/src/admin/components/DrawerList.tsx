import DrawerList from "../../admin seller/components/drawerList/DrawerList";
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

const menu = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: <DashboardIcon className="text-slate-500" />,
    activeIcon: <DashboardIcon className="text-white" />,
  },
  {
    name: "Customers",
    path: "/admin/users",
    icon: <PeopleAltOutlinedIcon className="text-slate-500" />,
    activeIcon: <PeopleAltOutlinedIcon className="text-white" />,
  },
  {
    name: "Sellers & Earnings",
    path: "/admin/sellers",
    icon: <StorefrontOutlinedIcon className="text-slate-500" />,
    activeIcon: <StorefrontOutlinedIcon className="text-white" />,
  },
  {
    name: "Products Catalog",
    path: "/admin/products",
    icon: <Inventory2OutlinedIcon className="text-slate-500" />,
    activeIcon: <Inventory2OutlinedIcon className="text-white" />,
  },
  {
    name: "Transactions",
    path: "/admin/transactions",
    icon: <ReceiptLongOutlinedIcon className="text-slate-500" />,
    activeIcon: <ReceiptLongOutlinedIcon className="text-white" />,
  },
  {
    name: "Coupons",
    path: "/admin/coupon",
    icon: <IntegrationInstructionsIcon className="text-slate-500" />,
    activeIcon: <IntegrationInstructionsIcon className="text-white" />,
  },
  {
    name: "Add New Coupon",
    path: "/admin/add-coupon",
    icon: <AddIcon className="text-slate-500" />,
    activeIcon: <AddIcon className="text-white" />,
  },
  {
    name: "Deals",
    path: "/admin/deals",
    icon: <LocalOfferIcon className="text-slate-500" />,
    activeIcon: <LocalOfferIcon className="text-white" />,
  },
  {
    name: "Home Page Grid",
    path: "/admin/home-grid",
    icon: <HomeIcon className="text-slate-500" />,
    activeIcon: <HomeIcon className="text-white" />,
  },
  {
    name: "Electronics Category",
    path: "/admin/electronics-category",
    icon: <ElectricBoltIcon className="text-slate-500" />,
    activeIcon: <ElectricBoltIcon className="text-white" />,
  },
  {
    name: "Shop By Category",
    path: "/admin/shop-by-category",
    icon: <Category className="text-slate-500" />,
    activeIcon: <Category className="text-white" />,
  },
];

const menu2 = [
  {
    name: "Logout",
    path: "/",
    icon: <LogoutIcon className="text-slate-500" />,
    activeIcon: <LogoutIcon className="text-white" />,
  },
];

interface DrawerListProps {
  toggleDrawer?: any;
}

const AdminDrawerList = ({ toggleDrawer }: DrawerListProps) => {
  return (
    <>
      <DrawerList toggleDrawer={toggleDrawer} menu={menu} menu2={menu2} />
    </>
  );
};

export default AdminDrawerList;
