import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState, useRef } from "react";
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
import ClearIcon from "@mui/icons-material/Clear";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const Navbar = () => {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const { user, cart, sellers } = useAppSelector((store) => store);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const isAdmin = Boolean(
    localStorage.getItem("admin_jwt") &&
    localStorage.getItem("role") === "ROLE_ADMIN"
  );

  const isSeller = Boolean(
    !isAdmin &&
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

  const executeSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) {
      setMobileSearchOpen(false);
      navigate(`/search-products?query=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleDesktopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleMobileSearchOpen = () => {
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 80);
  };

  return (
    <Box
      sx={{ zIndex: 100 }}
      className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80"
    >
      <div className="flex items-center gap-3 px-4 lg:px-12 h-[68px]">

        {/* ── Left: Hamburger + Brand ── */}
        <div className="flex items-center gap-3 shrink-0">
          <IconButton
            onClick={toggleDrawer(true)}
            aria-label="Open categories"
            sx={{ color: "#334155", p: "8px", "&:hover": { backgroundColor: "#F1F5F9" } }}
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
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700 ml-0.5" />
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
              Marketplace
            </span>
          </div>
        </div>

        {/* ── Center: Search Bar (Desktop md+) ── */}
        {isMd && (
          <form
            onSubmit={handleDesktopSubmit}
            className="flex flex-1 items-center bg-slate-50 border border-slate-200 hover:border-slate-400 focus-within:border-slate-700 focus-within:bg-white focus-within:shadow-sm rounded-xl transition-all duration-150 overflow-hidden mx-4"
          >
            {/* Search icon — acts as submit */}
            <button
              type="submit"
              className="flex items-center justify-center px-3.5 h-full text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              aria-label="Search"
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="w-full py-2.5 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center justify-center px-3 h-full text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                aria-label="Clear"
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </button>
            )}
          </form>
        )}

        {/* ── Right: Action Icons ── */}
        <div className="flex items-center gap-1 lg:gap-2 ml-auto shrink-0">

          {/* Mobile: search icon — opens inline bar below */}
          {!isMd && (
            <IconButton
              onClick={handleMobileSearchOpen}
              aria-label="Search"
              sx={{ color: "#475569", "&:hover": { backgroundColor: "#F1F5F9" } }}
            >
              <SearchIcon sx={{ fontSize: 22 }} />
            </IconButton>
          )}

          {/* User / Admin / Seller identity chip */}
          {isAdmin ? (
            <Button
              onClick={() => navigate("/admin")}
              sx={{
                textTransform: "none",
                p: "5px 14px",
                borderRadius: "9999px",
                backgroundColor: "#0F172A",
                color: "#FFFFFF",
                border: "1px solid #1E293B",
                "&:hover": { backgroundColor: "#1E293B", borderColor: "#334155" },
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldOutlinedIcon sx={{ fontSize: 16, color: "#60A5FA" }} />
              <span className="font-bold text-xs text-white">
                Admin Console
              </span>
            </Button>
          ) : isSeller && sellers?.profile ? (
            <Button
              onClick={() => navigate("/seller/account")}
              sx={{
                textTransform: "none",
                p: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
              }}
            >
              <Avatar sx={{ width: 28, height: 28, bgcolor: "#1E40AF", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {(sellers.profile.sellerName || sellers.profile.businessDetails?.businessName || "S")[0].toUpperCase()}
              </Avatar>
              <div className="hidden lg:block text-left pl-2 pr-1">
                <p className="font-bold text-xs text-slate-800 leading-tight">
                  {(sellers.profile.sellerName || sellers.profile.businessDetails?.businessName || "Seller").split(" ")[0]}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Partner</span>
              </div>
            </Button>
          ) : user.user ? (
            <Button
              onClick={() => navigate("/account/orders")}
              sx={{
                textTransform: "none",
                p: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
              }}
            >
              <Avatar sx={{ width: 28, height: 28, bgcolor: "#0F172A", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {user.user?.fullName?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <span className="font-semibold hidden lg:block text-slate-800 text-xs pl-2 pr-1">
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
                textTransform: "none",
                "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" },
              }}
            >
              Sign In
            </Button>
          )}

          {/* Wishlist */}
          <IconButton
            onClick={() => navigate("/wishlist")}
            sx={{ color: "#475569", p: "8px", "&:hover": { backgroundColor: "#F1F5F9", color: "#E11D48" } }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Cart */}
          <IconButton
            onClick={() => navigate("/cart")}
            sx={{ color: "#475569", p: "8px", "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" } }}
          >
            <Badge
              badgeContent={cart.cart?.cartItems?.length || 0}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#0F172A",
                  color: "#fff",
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

          {/* Seller Hub / Become a Seller (lg only, hidden for Admin) */}
          {isLarge && !isAdmin && (
            <Button
              onClick={becomeSellerClick}
              startIcon={
                isSeller
                  ? <DashboardOutlinedIcon sx={{ fontSize: 16 }} />
                  : <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />
              }
              variant={isSeller ? "contained" : "outlined"}
              size="small"
              sx={
                isSeller
                  ? {
                      backgroundColor: "#0F172A",
                      color: "#fff",
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
                      "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" },
                    }
              }
            >
              {isSeller ? "Seller Hub" : "Become a Seller"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Mobile: full-width search bar (slides in below header) ── */}
      {!isMd && mobileSearchOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); executeSearch(searchQuery); }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-slate-700 focus-within:bg-white rounded-xl overflow-hidden transition-all"
          >
            <button
              type="submit"
              className="flex items-center justify-center pl-3.5 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Search"
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </button>
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands…"
              className="flex-1 py-2.5 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center justify-center text-slate-400 hover:text-slate-600"
                aria-label="Clear"
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
              className="flex items-center justify-center pr-3 text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <ClearIcon sx={{ fontSize: 20 }} />
            </button>
          </form>
        </div>
      )}

      <Drawer open={open} onClose={toggleDrawer(false)}>
        <DrawerList toggleDrawer={toggleDrawer} />
      </Drawer>
    </Box>
  );
};

export default Navbar;
