import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  InputBase,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import "./Navbar.css";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import DrawerList from "./DrawerList";
import { useNavigate } from "react-router-dom";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const Navbar = () => {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const { user, cart, sellers } = useAppSelector((store) => store);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const isSeller = Boolean(
    localStorage.getItem("seller_jwt") &&
    localStorage.getItem("role") === "ROLE_SELLER" &&
    sellers?.profile?._id &&
    sellers?.profile?.accountStatus !== "CLOSED"
  );

  const becomeSellerClick = () => {
    if (isSeller) {
      navigate("/seller");
    } else {
      navigate("/become-seller");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-products?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/search-products");
    }
  };

  return (
    <Box
      sx={{ zIndex: 100 }}
      className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-shadow duration-200"
    >
      <div className="flex items-center justify-between px-4 lg:px-12 h-[68px]">
        {/* Left: Menu & Brand Logo */}
        <div className="flex items-center gap-4 lg:gap-8">
          <IconButton
            onClick={toggleDrawer(true)}
            aria-label="Open categories"
            sx={{
              color: "#334155",
              p: "8px",
              "&:hover": { backgroundColor: "#F1F5F9" },
            }}
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </IconButton>

          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                E-COM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700 ml-0.5"></span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
              Marketplace
            </span>
          </div>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center w-full bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 border border-slate-200/90 rounded-full px-3.5 py-1.5 transition-all duration-200"
          >
            <SearchIcon sx={{ color: "#94A3B8", fontSize: 20, mr: 1 }} />
            <InputBase
              placeholder="Search products, brands, collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                fontSize: "13px",
                color: "#0F172A",
                "& input": {
                  padding: "2px 0",
                  "&::placeholder": {
                    color: "#94A3B8",
                    opacity: 1,
                  },
                },
              }}
            />
          </form>
        </div>

        {/* Right: Actions (Profile, Wishlist, Cart, Seller Portal) */}
        <div className="flex items-center gap-1.5 lg:gap-3">
          {/* Mobile Search Icon */}
          <IconButton
            onClick={() => navigate("/search-products")}
            className="md:hidden"
            sx={{
              color: "#475569",
              "&:hover": { backgroundColor: "#F1F5F9" },
            }}
          >
            <SearchIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* User / Seller Identity */}
          {isSeller && sellers?.profile ? (
            <Button
              onClick={() => navigate("/seller/account")}
              className="flex items-center gap-2"
              sx={{
                textTransform: "none",
                p: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#1E40AF",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {(sellers.profile.sellerName || sellers.profile.businessDetails?.businessName || "S")[0].toUpperCase()}
              </Avatar>
              <div className="hidden lg:block text-left pr-1">
                <p className="font-bold text-xs text-slate-800 leading-tight">
                  {(sellers.profile.sellerName || sellers.profile.businessDetails?.businessName || "Seller").split(" ")[0]}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  Partner
                </span>
              </div>
            </Button>
          ) : user.user ? (
            <Button
              onClick={() => navigate("/account/orders")}
              className="flex items-center gap-2"
              sx={{
                textTransform: "none",
                p: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#0F172A",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {user.user?.fullName?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <span className="font-semibold hidden lg:block text-slate-800 text-xs pr-1">
                {user.user?.fullName?.split(" ")[0]}
              </span>
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AccountCircleOutlinedIcon sx={{ fontSize: "16px" }} />}
              onClick={() => navigate("/login")}
              sx={{
                borderColor: "#CBD5E1",
                color: "#0F172A",
                fontWeight: 600,
                fontSize: "13px",
                borderRadius: "9999px",
                px: 2,
                py: "5px",
                "&:hover": {
                  borderColor: "#0F172A",
                  backgroundColor: "#F8FAFC",
                },
              }}
            >
              Sign In
            </Button>
          )}

          {/* Wishlist Icon */}
          <IconButton
            onClick={() => navigate("/wishlist")}
            sx={{
              color: "#475569",
              p: "8px",
              "&:hover": { backgroundColor: "#F1F5F9", color: "#E11D48" },
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Cart Icon */}
          <IconButton
            onClick={() => navigate("/cart")}
            sx={{
              color: "#475569",
              p: "8px",
              "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            <Badge
              badgeContent={cart.cart?.cartItems?.length || 0}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "10px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                },
              }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          {/* Seller Action Button (Desktop) */}
          {isLarge && (
            <Button
              onClick={becomeSellerClick}
              startIcon={isSeller ? <DashboardOutlinedIcon sx={{ fontSize: 16 }} /> : <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />}
              variant={isSeller ? "contained" : "outlined"}
              size="small"
              sx={
                isSeller
                  ? {
                      backgroundColor: "#0F172A",
                      color: "#FFFFFF",
                      "&:hover": { backgroundColor: "#1E293B" },
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "12px",
                      borderRadius: "8px",
                      px: 2,
                      py: "6px",
                    }
                  : {
                      borderColor: "#CBD5E1",
                      color: "#334155",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "12px",
                      borderRadius: "8px",
                      px: 2,
                      py: "6px",
                      "&:hover": {
                        borderColor: "#0F172A",
                        backgroundColor: "#F8FAFC",
                      },
                    }
              }
            >
              {isSeller ? "Seller Hub" : "Become a Seller"}
            </Button>
          )}
        </div>
      </div>

      <Drawer open={open} onClose={toggleDrawer(false)}>
        <DrawerList toggleDrawer={toggleDrawer} />
      </Drawer>
    </Box>
  );
};

export default Navbar;
