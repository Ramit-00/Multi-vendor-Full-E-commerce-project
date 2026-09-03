import { Alert, Divider, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Order from './Order';
import UserDetails from './UserDetails';
import SavedCards from './SavedCards';
import OrderDetails from './OrderDetails';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { performLogout } from '../../../Redux Toolkit/Customer/AuthSlice';
import Addresses from './Adresses';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

const menu = [
    { name: "Overview & Profile", path: "/account/profile", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
    { name: "My Orders", path: "/account/orders", icon: <ShoppingBagOutlinedIcon fontSize="small" /> },
    { name: "Saved Cards", path: "/account/saved-card", icon: <CreditCardOutlinedIcon fontSize="small" /> },
    { name: "Addresses", path: "/account/addresses", icon: <LocationOnOutlinedIcon fontSize="small" /> },
    { name: "Logout", path: "/", icon: <LogoutOutlinedIcon fontSize="small" /> }
];

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { user, orders } = useAppSelector(store => store);
    const [snackbarOpen, setOpenSnackbar] = useState(false);

    const handleLogout = () => {
        dispatch(performLogout());
        navigate("/");
    };

    const handleClick = (item: any) => {
        if (item.name === "Logout") {
            handleLogout();
        } else {
            navigate(`${item.path}`);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    useEffect(() => {
        if (user.profileUpdated || orders.orderCanceled || user.error) {
            setOpenSnackbar(true);
        }
    }, [user.profileUpdated, orders.orderCanceled, user.error]);

    return (
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen py-10 bg-[#FAFAFA]'>
            <div className='flex items-center justify-between pb-6'>
                <div>
                    <h1 className='text-2xl lg:text-3xl font-black text-slate-900 tracking-tight'>
                        My Account
                    </h1>
                    <p className='text-xs text-slate-500 mt-1'>
                        Manage your orders, profile identity, and saved preferences
                    </p>
                </div>
            </div>
            <Divider sx={{ borderColor: '#E2E8F0' }} />

            <div className='grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8 min-h-[75vh]'>
                {/* Left Navigation Sidebar */}
                <div className="col-span-1 space-y-2">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm space-y-1">
                        {menu.map((item) => {
                            const isSelected = item.path === location.pathname || (item.path === "/account/profile" && location.pathname === "/account");
                            return (
                                <div
                                    key={item.name}
                                    onClick={() => handleClick(item)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all ${
                                        isSelected
                                            ? "bg-slate-900 text-white font-bold shadow-sm"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                    }`}
                                >
                                    <span className={isSelected ? "text-blue-400" : "text-slate-400"}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className='lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm'>
                    <Routes>
                        <Route path='/' element={<UserDetails />} />
                        <Route path='/orders' element={<Order />} />
                        <Route path='/orders/:orderId/item/:orderItemId' element={<OrderDetails />} />
                        <Route path='/profile' element={<UserDetails />} />
                        <Route path='/saved-card' element={<SavedCards />} />
                        <Route path='/addresses' element={<Addresses />} />
                    </Routes>
                </div>
            </div>

            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={user.error ? "error" : "success"}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {user.error ? user.error : orders.orderCanceled ? "Order canceled successfully" : "Profile updated successfully"}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Profile;