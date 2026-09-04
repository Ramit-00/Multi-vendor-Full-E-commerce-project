import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Button, Drawer, IconButton, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import { adminLogout } from "../../Redux Toolkit/Admin/AdminPlatformSlice";

interface AdminNavbarProps {
  DrawerList: any;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ DrawerList }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleSignOut = () => {
    dispatch(adminLogout());
    navigate("/");
  };

  return (
    <header className="h-[68px] bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 select-none shadow-lg">
      {/* Left: Hamburger & Brand Identity */}
      <div className="flex items-center gap-3 sm:gap-4">
        <IconButton
          onClick={toggleDrawer(true)}
          className="lg:hidden"
          sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF", backgroundColor: "#1E293B" } }}
          aria-label="Open administration menu"
        >
          <MenuIcon />
        </IconButton>

        <div
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <ShieldOutlinedIcon sx={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                E-COM
              </span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                Admin Vault
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Superuser Control Panel
            </p>
          </div>
        </div>
      </div>

      {/* Right: Security Pill, Identity, and Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold">LIVE ROOT</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">admin@ecom.com</span>
        </div>

        {/* User Identity Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <Avatar
            sx={{
              width: 26,
              height: 26,
              bgcolor: "#2563EB",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            A
          </Avatar>
          <span className="text-xs font-bold text-slate-200 hidden sm:inline-block pr-1">
            Master Admin
          </span>
        </div>

        {/* Storefront Link */}
        <Button
          onClick={() => navigate("/")}
          startIcon={<StorefrontOutlinedIcon sx={{ fontSize: 16 }} />}
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12px",
            color: "#94A3B8",
            border: "1px solid #334155",
            borderRadius: "10px",
            px: 1.5,
            py: "4px",
            "&:hover": { color: "#FFFFFF", borderColor: "#64748B", backgroundColor: "#1E293B" },
          }}
        >
          <span className="hidden sm:inline">Marketplace </span>Storefront
        </Button>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
          size="small"
          variant="contained"
          sx={{
            backgroundColor: "#7F1D1D",
            color: "#FEE2E2",
            "&:hover": { backgroundColor: "#991B1B" },
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12px",
            borderRadius: "10px",
            px: 1.5,
            py: "4px",
            boxShadow: "none",
          }}
        >
          Logout
        </Button>

        {/* Mobile Drawer */}
        <Drawer open={open} onClose={toggleDrawer(false)}>
          <DrawerList toggleDrawer={toggleDrawer} />
        </Drawer>
      </div>
    </header>
  );
};

export default AdminNavbar;
