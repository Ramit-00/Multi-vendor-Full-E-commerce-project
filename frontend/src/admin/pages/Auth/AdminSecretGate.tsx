import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { adminLogin, clearAdminError } from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CircularProgress, Alert } from "@mui/material";

const AdminSecretGate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.adminPlatform);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAdminError());
    localStorage.removeItem("seller_jwt");
    localStorage.removeItem("customer_jwt");
    localStorage.removeItem("jwt");
    localStorage.removeItem("seller_role");
    dispatch(
      adminLogin({
        email,
        password,
        adminSecretKey,
        navigate,
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Store Link */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        Return to Marketplace
      </button>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-blue-400 shadow-inner">
            <ShieldOutlinedIcon sx={{ fontSize: 26 }} />
          </div>
          <span className="inline-block text-[10px] uppercase font-mono tracking-widest text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            System Operations Core
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Administrator Gateway
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Restricted access portal. Authentication requires cryptographic verification and administrative keys.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{
              backgroundColor: "#7F1D1D",
              color: "#FEE2E2",
              fontSize: "12px",
              borderRadius: "10px",
              "& .MuiAlert-icon": { color: "#FCA5A5" },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Security Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <EmailOutlinedIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ecom.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Admin Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <LockOutlinedIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Toggle password view"
              >
                {showPassword ? (
                  <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </button>
            </div>
          </div>

          {/* Master Admin Security Key */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyOutlinedIcon sx={{ fontSize: 14, color: "#FBBF24" }} />
                Master Security Key
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                ENV-CHECK
              </span>
            </div>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                required
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
                placeholder="Enter ADMIN_SECRET_KEY"
                className="w-full bg-slate-950 border border-amber-900/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-amber-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono outline-none transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-300 transition-colors"
                aria-label="Toggle key view"
              >
                {showSecretKey ? (
                  <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />
              ) : (
                <>
                  <LockOutlinedIcon sx={{ fontSize: 16 }} />
                  Authenticate & Unlock Vault
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500">
            Internal administrative endpoint. All access attempts and operational commands are cryptographically signed and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSecretGate;
