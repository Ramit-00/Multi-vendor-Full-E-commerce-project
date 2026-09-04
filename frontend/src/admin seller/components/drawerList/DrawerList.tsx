import * as React from "react";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { resetSellerProfile } from "../../../Redux Toolkit/Seller/sellerSlice";

export interface Menu {
    name: string;
    path: string;
    icon: React.ReactElement<any>;
    activeIcon: React.ReactElement<any>;
}

interface DrawerListProps {
    toggleDrawer?: any;
    menu: Menu[];
    menu2: Menu[];
}

const DrawerList = ({ toggleDrawer, menu, menu2 }: DrawerListProps) => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("seller_jwt");
        localStorage.removeItem("admin_jwt");
        localStorage.removeItem("role");
        localStorage.removeItem("seller_role");
        dispatch(resetSellerProfile());
    };

    const handleClick = (item: any) => () => {
        if (item.name === "Logout") {
            handleLogout();
        }
        navigate(item.path);
        if (toggleDrawer) toggleDrawer(false)();
    };

    return (
        <div className="h-full bg-white">
            <div className="flex flex-col justify-between h-full w-[270px] border-r border-slate-200 py-6">
                <div>
                    <div className="space-y-1.5 px-3">
                        {menu.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.name}
                                    onClick={handleClick(item)}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                                            isActive
                                                ? "bg-slate-900 text-white font-bold shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                        }`}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 38,
                                                color: isActive ? "#FFFFFF" : "#64748B",
                                            }}
                                        >
                                            {isActive ? item.activeIcon : item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.name}
                                            primaryTypographyProps={{
                                                fontSize: "14px",
                                                fontWeight: isActive ? 700 : 500,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4 px-3">
                    <Divider sx={{ mx: 2, borderColor: "#F1F5F9" }} />
                    <div className="space-y-1.5">
                        {menu2.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    onClick={handleClick(item)}
                                    className="cursor-pointer"
                                    key={item.name}
                                >
                                    <div
                                        className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                                            isActive
                                                ? "bg-slate-900 text-white font-bold shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                        }`}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 38,
                                                color: isActive ? "#FFFFFF" : "#64748B",
                                            }}
                                        >
                                            {isActive ? item.activeIcon : item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.name}
                                            primaryTypographyProps={{
                                                fontSize: "14px",
                                                fontWeight: isActive ? 700 : 500,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrawerList;
