import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../Redux Toolkit/Store";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Modal,
  Snackbar,
} from "@mui/material";
import ProfileFildCard from "./ProfileFildCard";
import EditIcon from "@mui/icons-material/Edit";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PersonalDetailsForm from "./PersionalDetailsForm";
import BusinessDetailsForm from "./BussinessDetailsForm";
import PickupAddressForm from "./PickupAddressForm";

export const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 460 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "16px",
};

const Profile = () => {
  const { sellers } = useAppSelector((store) => store);
  const [open, setOpen] = React.useState(false);
  const [selectedForm, setSelectedForm] = useState("personalDetails");
  const handleClose = () => setOpen(false);
  const [snackbarOpen, setOpenSnackbar] = useState(false);

  const handleOpen = (formName: string) => {
    setOpen(true);
    setSelectedForm(formName);
  };

  const renderSelectedForm = () => {
    switch (selectedForm) {
      case "personalDetails":
        return <PersonalDetailsForm onClose={handleClose} />;
      case "businessDetails":
        return <BusinessDetailsForm onClose={handleClose} />;
      case "pickupAddress":
        return <PickupAddressForm onClose={handleClose} />;
      default:
        return null;
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (sellers.profileUpdated || sellers.error) {
      setOpenSnackbar(true);
    }
  }, [sellers.profileUpdated, sellers.error]);

  const sellerName = sellers.profile?.sellerName || "Verified Seller";
  const businessName = sellers.profile?.businessDetails?.businessName || sellerName;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-12 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 bg-slate-950 border border-slate-800 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <Avatar
          sx={{
            width: { xs: 80, sm: 96 },
            height: { xs: 80, sm: 96 },
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

        <div className="space-y-2 text-center sm:text-left flex-grow relative z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {sellerName}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <VerifiedIcon sx={{ fontSize: 14 }} />
              {sellers.profile?.accountStatus || "ACTIVE"}
            </span>
          </div>

          <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
            <StorefrontIcon sx={{ fontSize: 16, color: "#38BDF8" }} />
            <span>Store: <strong className="text-white">{businessName}</strong></span>
          </p>

          <p className="text-xs text-slate-400">
            E-COM Authorized Merchant Partner &middot; Registered on Marketplace
          </p>
        </div>

        <div className="relative z-10">
          <Button
            onClick={() => handleOpen("personalDetails")}
            startIcon={<EditIcon />}
            variant="contained"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <PersonOutlineIcon sx={{ color: "#0F172A" }} />
              <h2>Personal Credentials</h2>
            </div>
            <Button
              onClick={() => handleOpen("personalDetails")}
              size="small"
              sx={{ textTransform: "none", color: "#0F172A", fontWeight: 700, borderRadius: "8px", "&:hover": { backgroundColor: "#F1F5F9" } }}
            >
              Edit
            </Button>
          </div>

          <div className="space-y-1">
            <ProfileFildCard
              keys={"Authorized Name"}
              value={sellers.profile?.sellerName || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"Registered Email"}
              value={sellers.profile?.email || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"Contact Mobile"}
              value={sellers.profile?.mobile || "Not provided"}
            />
          </div>
        </div>

        {/* Business Credentials Card */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <StorefrontIcon sx={{ color: "#0F172A" }} />
              <h2>Business Details</h2>
            </div>
            <Button
              onClick={() => handleOpen("businessDetails")}
              size="small"
              sx={{ textTransform: "none", color: "#0F172A", fontWeight: 700, borderRadius: "8px", "&:hover": { backgroundColor: "#F1F5F9" } }}
            >
              Edit
            </Button>
          </div>

          <div className="space-y-1">
            <ProfileFildCard
              keys={"Store / Brand Name"}
              value={sellers.profile?.businessDetails?.businessName || sellerName}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"GSTIN Number"}
              value={sellers.profile?.GSTIN || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"Account Status"}
              value={sellers.profile?.accountStatus || "ACTIVE"}
            />
          </div>
        </div>
      </div>

      {/* Pickup & Operations Address Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <LocationOnOutlinedIcon sx={{ color: "#0F172A" }} />
            <h2>Pickup & Operational Address</h2>
          </div>
          <Button
            onClick={() => handleOpen("pickupAddress")}
            size="small"
            sx={{ textTransform: "none", color: "#0F172A", fontWeight: 700, borderRadius: "8px", "&:hover": { backgroundColor: "#F1F5F9" } }}
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <ProfileFildCard
              keys={"Street Address"}
              value={sellers.profile?.pickupAddress?.address || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"Locality / Area"}
              value={sellers.profile?.pickupAddress?.locality || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"City"}
              value={sellers.profile?.pickupAddress?.city || "Not provided"}
            />
          </div>

          <div className="space-y-1">
            <ProfileFildCard
              keys={"State"}
              value={sellers.profile?.pickupAddress?.state || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"PIN Code"}
              value={sellers.profile?.pickupAddress?.pinCode || "Not provided"}
            />
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <ProfileFildCard
              keys={"Pickup Contact Mobile"}
              value={
                sellers.profile?.pickupAddress?.mobile ||
                sellers.profile?.mobile ||
                "Not provided"
              }
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>{renderSelectedForm()}</Box>
      </Modal>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={sellers.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {sellers.error ? sellers.error : "Profile Updated Successfully"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Profile;
