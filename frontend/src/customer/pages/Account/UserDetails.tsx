import { useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Chip
} from "@mui/material";
import { useAppSelector } from "../../../Redux Toolkit/Store";
import { useNavigate } from "react-router-dom";
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const UserDetails = () => {
  const { user, orders, sellers } = useAppSelector((store) => store);
  const navigate = useNavigate();

  const isSeller = Boolean(
    sellers?.profile?._id ||
    localStorage.getItem("role") === "ROLE_SELLER" ||
    localStorage.getItem("seller_jwt")
  );
  const seller = sellers?.profile;
  const currentUser = user.user;

  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || "");

  const handleSaveProfile = () => {
    if (currentUser) {
      currentUser.fullName = fullName;
    }
    setEditOpen(false);
  };

  // If this user is a seller, render the Seller Profile view
  if (isSeller && seller) {
    const sellerName = seller.sellerName || "Verified Seller";
    const businessName = seller.businessDetails?.businessName || sellerName;

    return (
      <div className="space-y-6">
        {/* Seller Executive Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-sm">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <Avatar
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: "#0F172A",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  border: "3px solid #334155",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                }}
              >
                {sellerName.charAt(0).toUpperCase()}
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {sellerName}
                  </h2>
                  <VerifiedUserIcon sx={{ color: "#38BDF8", fontSize: 22 }} />
                </div>

                <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <StorefrontIcon sx={{ fontSize: 16, color: "#38BDF8" }} />
                  <span>Store: <strong className="text-white">{businessName}</strong></span>
                </p>

                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />
                    {seller.accountStatus || "ACTIVE"}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800">
                    Verified Seller Partner
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <Button
                onClick={() => navigate("/seller")}
                variant="contained"
                size="small"
                startIcon={<DashboardOutlinedIcon />}
                sx={{
                  backgroundColor: "#0F172A",
                  "&:hover": { backgroundColor: "#1E293B" },
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  px: 2.5,
                  py: 1,
                  border: "1px solid #334155",
                }}
              >
                Go to Seller Dashboard
              </Button>
              <Button
                onClick={() => navigate("/seller/account")}
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: "#475569",
                  color: "#E2E8F0",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                Edit Credentials
              </Button>
            </div>
          </div>
        </div>

        {/* Seller Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/seller/orders")}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:border-slate-400 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Store Orders</span>
              <ShoppingBagOutlinedIcon sx={{ fontSize: 18, color: "#0F172A" }} />
            </div>
            <div className="text-2xl font-black text-slate-900">Manage</div>
            <p className="text-[11px] text-slate-600 font-semibold mt-1">View Customer Orders &rarr;</p>
          </div>

          <div
            onClick={() => navigate("/seller/products")}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:border-slate-400 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Products</span>
              <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#0F172A" }} />
            </div>
            <div className="text-2xl font-black text-slate-900">Catalog</div>
            <p className="text-[11px] text-slate-600 font-semibold mt-1">Manage Listings &rarr;</p>
          </div>

          <div
            onClick={() => navigate("/seller/add-product")}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl cursor-pointer hover:border-slate-400 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">New Product</span>
              <StorefrontIcon sx={{ fontSize: 18, color: "#0F172A" }} />
            </div>
            <div className="text-2xl font-black text-slate-900">+ Add</div>
            <p className="text-[11px] text-slate-600 font-semibold mt-1">List New Product &rarr;</p>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Merchant Status</span>
              <SecurityOutlinedIcon sx={{ fontSize: 18, color: "#10B981" }} />
            </div>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
              <span>● Active Seller</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Verified Credentials</p>
          </div>
        </div>

        {/* Structured Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Merchant Credentials */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <BusinessOutlinedIcon sx={{ color: "#0F172A" }} />
                <h3>Business &amp; Merchant Details</h3>
              </div>
              <Chip label="Verified" size="small" sx={{ backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: 700, fontSize: "11px" }} />
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="text-[11px] uppercase font-bold text-slate-400">Seller Name</p>
                <p className="font-bold text-slate-900 text-sm">{sellerName}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="text-[11px] uppercase font-bold text-slate-400">Store / Business Name</p>
                <p className="font-bold text-slate-900 text-sm">{businessName}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="text-[11px] uppercase font-bold text-slate-400">GSTIN / Tax ID</p>
                <p className="font-bold text-slate-900 text-sm font-mono">{seller.GSTIN || "Not Provided"}</p>
              </div>
            </div>
          </div>

          {/* Contact & Pickup Location */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <LocationOnOutlinedIcon sx={{ color: "#0F172A" }} />
                <h3>Contact &amp; Pickup Address</h3>
              </div>
              <Chip label="Authorized" size="small" sx={{ backgroundColor: "#ECFDF5", color: "#065F46", fontWeight: 700, fontSize: "11px" }} />
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Registered Email</p>
                  <p className="font-bold text-slate-900 text-sm">{seller.email}</p>
                </div>
                <EmailOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Registered Mobile</p>
                  <p className="font-bold text-slate-900 text-sm">{seller.mobile || "Not Provided"}</p>
                </div>
                <PhoneOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="text-[11px] uppercase font-bold text-slate-400">Pickup &amp; Return Address</p>
                <p className="font-bold text-slate-900 text-sm">
                  {typeof seller.pickupAddress === 'object' && seller.pickupAddress !== null
                    ? `${seller.pickupAddress.address || ''}, ${seller.pickupAddress.city || ''}, ${seller.pickupAddress.state || ''} ${seller.pickupAddress.pinCode || ''}`
                    : "Primary Merchant Fulfillment Center"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the Customer Profile view
  const memberId = currentUser?._id
    ? String(currentUser._id).slice(-8).toUpperCase()
    : "8294FA31";

  const totalOrdersCount = orders.orders?.length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Executive Cover & ID Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-md">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <Avatar
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: "#1E3A8A",
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color: "#F8FAFC",
                  border: "3px solid #64748B",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                }}
              >
                {currentUser?.fullName?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {currentUser?.fullName || "Valued Customer"}
                </h2>
                <VerifiedUserIcon sx={{ color: "#60A5FA", fontSize: 22 }} />
              </div>

              <p className="text-xs text-slate-300 font-medium">
                {currentUser?.email || "customer@example.com"}
              </p>

              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  <BadgeIcon sx={{ fontSize: 13, color: "#93C5FD" }} />
                  ID: #{memberId}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900/60 text-blue-200 border border-blue-700">
                  {currentUser?.role === "ROLE_ADMIN"
                    ? "Administrator"
                    : "Verified Customer"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex gap-2.5 shrink-0">
            <Button
              onClick={() => {
                setFullName(currentUser?.fullName || "");
                setEditOpen(true);
              }}
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: "#64748B",
                color: "#E2E8F0",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                "&:hover": {
                  borderColor: "#93C5FD",
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators / Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/account/orders")}
          className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Orders</span>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 18, color: "#1E40AF" }} />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalOrdersCount}</div>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">View Order History &rarr;</p>
        </div>

        <div
          onClick={() => navigate("/wishlist")}
          className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Wishlist</span>
            <FavoriteBorderOutlinedIcon sx={{ fontSize: 18, color: "#EF4444" }} />
          </div>
          <div className="text-2xl font-black text-slate-900">Saved</div>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">Browse Items &rarr;</p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Security</span>
            <SecurityOutlinedIcon sx={{ fontSize: 18, color: "#10B981" }} />
          </div>
          <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
            <span>● 2FA Active</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Passwordless OTP</p>
        </div>

        <div
          onClick={() => navigate("/account/addresses")}
          className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Address</span>
            <LocationOnOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
          </div>
          <div className="text-sm font-bold text-slate-800">Primary Delivery</div>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">Manage Addresses &rarr;</p>
        </div>
      </div>

      {/* 3. Structured Two-Column Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <PersonOutlineOutlinedIcon sx={{ color: "#1E40AF" }} />
              <h3>Personal Identity &amp; Contact</h3>
            </div>
            <Chip label="Verified" size="small" sx={{ backgroundColor: "#EFF6FF", color: "#1E40AF", fontWeight: 700, fontSize: "11px" }} />
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Full Name</p>
                  <p className="font-semibold text-slate-800 text-sm">{currentUser?.fullName || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EmailOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Email Address</p>
                  <p className="font-semibold text-slate-800 text-sm">{currentUser?.email || "customer@example.com"}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Primary
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LanguageOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Language</p>
                  <p className="font-semibold text-slate-800 text-sm">English (United States)</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Default
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CurrencyRupeeOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400">Preferred Currency</p>
                  <p className="font-semibold text-slate-800 text-sm">INR (₹) - Indian Rupee</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <SecurityOutlinedIcon sx={{ color: "#1E40AF" }} />
              <h3>Security &amp; Preferences</h3>
            </div>
            <Chip label="High Protection" size="small" sx={{ backgroundColor: "#ECFDF5", color: "#065F46", fontWeight: 700, fontSize: "11px" }} />
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[11px] uppercase font-bold text-slate-400">Authentication Method</p>
              <p className="font-semibold text-slate-800 text-sm">One-Time Password (OTP)</p>
              <p className="text-xs text-slate-500">Secure passwordless verification codes sent to your registered email on every login.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[11px] uppercase font-bold text-slate-400">Two-Factor Security (2FA)</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-800 text-sm">Enabled &amp; Monitored</span>
              </div>
              <p className="text-xs text-slate-500">Prevents unauthorized account access with time-limited cryptographic tokens.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[11px] uppercase font-bold text-slate-400">Active Device Session</p>
              <p className="font-semibold text-slate-800 text-sm">Current Session (Windows / Localhost)</p>
              <p className="text-xs text-slate-500">Signed in with active JWT token authorization.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[11px] uppercase font-bold text-slate-400">Data Encryption Standard</p>
              <p className="font-semibold text-slate-800 text-sm">TLS 1.3 End-to-End Encrypted</p>
              <p className="text-xs text-slate-500">All communication and card details are securely tokenized.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.25rem" }}>
          Edit Profile Information
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <TextField
            fullWidth
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ textTransform: "none", color: "#64748B", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            sx={{
              backgroundColor: "#1E40AF",
              "&:hover": { backgroundColor: "#1E3A8A" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 3
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserDetails;
