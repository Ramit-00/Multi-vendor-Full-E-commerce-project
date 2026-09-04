import { Alert, Button, Snackbar } from "@mui/material";
import { useState, useEffect } from "react";
import SellerAccountForm from "./SellerAccountForm";
import SellerLoginForm from "./SellerLoginForm";
import SellerVerificationGate from "./SellerVerificationGate";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { resetSellerAuthState } from "../../../Redux Toolkit/Seller/sellerAuthenticationSlice";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

const BecomeSeller = () => {
  const dispatch = useAppDispatch();
  const [isLoginPage, setIsLoginPage] = useState(false);
  const { sellerAuth } = useAppSelector((store) => store);

  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [verifiedMobile, setVerifiedMobile] = useState<string>("");
  const [isVerified, setIsVerified] = useState(false);

  const handleCloseSnackbar = () => setSnackbarOpen(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (sellerAuth.emailVerified && sellerAuth.verifiedEmail) {
      setIsVerified(true);
      setVerifiedEmail(sellerAuth.verifiedEmail);
      if (sellerAuth.verifiedMobile) setVerifiedMobile(sellerAuth.verifiedMobile);
    }
  }, [sellerAuth.emailVerified, sellerAuth.verifiedEmail, sellerAuth.verifiedMobile]);

  useEffect(() => {
    if (sellerAuth.sellerCreated || sellerAuth.error || sellerAuth.otpSent) {
      setSnackbarOpen(true);
    }
  }, [sellerAuth.sellerCreated, sellerAuth.error, sellerAuth.otpSent]);

  const handleVerificationSuccess = (email: string, mobile: string) => {
    setVerifiedEmail(email);
    setVerifiedMobile(mobile);
    setIsVerified(true);
  };

  return (
    <div className="grid md:gap-10 grid-cols-12 min-h-screen bg-[#FAFAFA]">
      {/* Left Column: Form Panel */}
      <section className="col-span-12 lg:col-span-5 md:col-span-6 p-6 sm:p-10 shadow-sm bg-white border-r border-slate-200/80 flex flex-col justify-between">
        <div>
          {isLoginPage ? (
            <SellerLoginForm onSwitchToRegister={() => setIsLoginPage(false)} />
          ) : !isVerified ? (
            <SellerVerificationGate onVerified={handleVerificationSuccess} />
          ) : (
            <SellerAccountForm
              initialEmail={verifiedEmail}
              initialMobile={verifiedMobile}
            />
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
          <p className="text-center text-xs text-slate-500 font-medium">
            {isLoginPage
              ? "Want to register a new store?"
              : "Already have a registered merchant account?"}
          </p>
          <Button
            onClick={() => {
              dispatch(resetSellerAuthState());
              setIsLoginPage(!isLoginPage);
            }}
            fullWidth
            sx={{
              py: "10px",
              borderColor: "#E2E8F0",
              color: "#0F172A",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              "&:hover": {
                borderColor: "#0F172A",
                backgroundColor: "#F8FAFC",
              },
            }}
            variant="outlined"
          >
            {isLoginPage ? "Register New Seller Account" : "Sign in to Seller Portal"}
          </Button>
        </div>
      </section>

      {/* Right Column: Hero Content & Value Props */}
      <section className="hidden md:flex col-span-12 lg:col-span-7 md:col-span-6 justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
              <StorefrontIcon sx={{ fontSize: 16 }} />
              <span>Merchant Partner Program</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Scale Your Direct-to-Consumer Business Across India
            </h1>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Partner with E-COM to access a nationwide customer base, powerful catalog management tools, and guaranteed settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <VerifiedUserOutlinedIcon sx={{ fontSize: 20 }} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Vetted Network</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Strict tax and identity verification to safeguard your store from fraud.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <BarChartOutlinedIcon sx={{ fontSize: 20 }} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Real-Time Hub</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Track revenue, inventory status, and orders in a unified dashboard.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Automated Payouts</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Scheduled weekly bank settlements with transparent fee reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={sellerAuth.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px" }}
        >
          {sellerAuth.error
            ? sellerAuth.error
            : sellerAuth.sellerCreated
            ? sellerAuth.sellerCreated
            : "Verification code sent to your email!"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BecomeSeller;
