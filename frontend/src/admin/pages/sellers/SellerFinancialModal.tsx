import React from "react";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import {
  updateSellerAccountStatus,
} from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import {
  Drawer,
  IconButton,
  CircularProgress,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";


interface SellerFinancialModalProps {
  data: any;
  loading: boolean;
  onClose: () => void;
}

const SellerFinancialModal: React.FC<SellerFinancialModalProps> = ({
  data,
  loading,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  if (!data && !loading) return null;

  const seller = data?.seller;
  const financials = data?.financials;
  const transactions = data?.transactions || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleStatusChange = (newStatus: string) => {
    if (seller?._id) {
      dispatch(updateSellerAccountStatus({ id: seller._id, status: newStatus }));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(data || loading)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "600px", md: "700px" },
          p: 0,
          backgroundColor: "#FAFAFA",
        },
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 text-white p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <StorefrontIcon sx={{ fontSize: 24 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  {seller?.businessDetails?.businessName || seller?.sellerName || "Merchant Store"}
                </h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  seller?.accountStatus === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : seller?.accountStatus === "BANNED"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {seller?.accountStatus || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Seller ID: {seller?._id}
              </p>
            </div>
          </div>

          <IconButton onClick={onClose} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
            <p className="text-xs text-slate-500 font-semibold">
              Compiling merchant financials and transaction logs...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Financial Summary Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MonetizationOnOutlinedIcon sx={{ fontSize: 16 }} />
                Merchant Revenue & Money Generated
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {/* Gross Revenue */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Sales</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {formatCurrency(financials?.totalRevenue || 0)}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    From {financials?.totalOrders || 0} total orders
                  </span>
                </div>

                {/* Net Payout */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Net Earnings</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {formatCurrency(financials?.netSellerPayout || 0)}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    After 10% commission
                  </span>
                </div>

                {/* Platform Commission */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Platform Take (10%)</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {formatCurrency(financials?.platformFee || 0)}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Marketplace service fee
                  </span>
                </div>

                {/* Completed Orders */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Fulfillment</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {financials?.completedCount || 0} Delivered
                  </p>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block font-semibold">
                    {formatCurrency(financials?.completedRevenue || 0)} settled
                  </span>
                </div>

                {/* Refunds */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-rose-600 uppercase">Cancellations</span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {financials?.cancelledCount || 0} Cancelled
                  </p>
                  <span className="text-[10px] text-rose-500 mt-0.5 block font-semibold">
                    {formatCurrency(financials?.totalRefunds || 0)} refunded
                  </span>
                </div>

                {/* Active Products */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Catalog</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {financials?.productCount || 0} Products
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Active listings in store
                  </span>
                </div>
              </div>
            </div>

            {/* Business & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Info */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <StorefrontIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  Business Information
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Merchant:</strong> {seller?.sellerName}</p>
                  <p><strong>Email:</strong> {seller?.email}</p>
                  <p><strong>Mobile:</strong> {seller?.mobile}</p>
                  <p><strong>GSTIN:</strong> <span className="font-mono">{seller?.GSTIN}</span></p>
                  <p><strong>City:</strong> {seller?.pickupAddress?.city || "N/A"}, {seller?.pickupAddress?.state || ""}</p>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <AccountBalanceIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  Settlement Bank Details
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Holder:</strong> {seller?.bankDetails?.accountHolderName || seller?.sellerName}</p>
                  <p><strong>Account:</strong> <span className="font-mono">{seller?.bankDetails?.accountNumber || "N/A"}</span></p>
                  <p><strong>IFSC:</strong> <span className="font-mono">{seller?.bankDetails?.ifscCode || "N/A"}</span></p>
                  <p><strong>Verified:</strong> {seller?.isEmailVerified ? "Yes (Email Validated)" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Governance Status Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Merchant Account Governance
                </span>
                <span className="text-[11px] text-slate-500">
                  Current Status: <strong>{seller?.accountStatus}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {seller?.accountStatus !== "ACTIVE" && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleStatusChange("ACTIVE")}
                    sx={{
                      backgroundColor: "#059669",
                      "&:hover": { backgroundColor: "#047857" },
                      textTransform: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "8px",
                    }}
                  >
                    Activate Merchant
                  </Button>
                )}
                {seller?.accountStatus !== "SUSPENDED" && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStatusChange("SUSPENDED")}
                    sx={{
                      borderColor: "#F59E0B",
                      color: "#D97706",
                      textTransform: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#FEF3C7" },
                    }}
                  >
                    Suspend
                  </Button>
                )}
                {seller?.accountStatus !== "BANNED" && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleStatusChange("BANNED")}
                    sx={{
                      borderColor: "#EF4444",
                      color: "#DC2626",
                      textTransform: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#FEE2E2" },
                    }}
                  >
                    Ban Merchant
                  </Button>
                )}
              </div>
            </div>

            {/* Transaction Ledger for this Seller */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ReceiptLongOutlinedIcon sx={{ fontSize: 16 }} />
                Seller Transaction History ({transactions.length})
              </h3>

              {transactions.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No transaction records recorded for this seller yet.
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Tx ID</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx: any) => (
                        <tr key={tx._id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {tx._id?.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {tx.customer?.fullName || tx.customer?.email || "Customer"}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {formatCurrency(tx.order?.totalSellingPrice || 0)}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(tx.createdAt || tx.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Settled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default SellerFinancialModal;
