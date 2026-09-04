import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchPlatformOverview } from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CircularProgress } from "@mui/material";

const AdminOverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { overview, loading } = useAppSelector((state) => state.adminPlatform);

  useEffect(() => {
    dispatch(fetchPlatformOverview());
  }, [dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 lg:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Operations Core • Real-Time Financials
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Marketplace Executive Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Master control panel monitoring gross merchandise sales, commission yields, vendor governance, and transaction settlements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(fetchPlatformOverview())}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <TrendingUpIcon sx={{ fontSize: 16 }} />
              Refresh Metrics
            </button>
          </div>
        </div>
      </div>

      {loading && !overview ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <CircularProgress size={36} sx={{ color: "#0F172A" }} />
          <p className="text-xs font-semibold text-slate-500">
            Calculating marketplace financials & ledger entries...
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Gross Merchandise Value */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Marketplace Volume (GMV)
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <AttachMoneyIcon sx={{ fontSize: 22 }} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(overview?.totalGMV || 0)}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Across {overview?.totalOrders || 0} total platform orders
                </p>
              </div>
            </div>

            {/* Card 2: Platform Yield / Earnings */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Platform Commission (10%)
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  {formatCurrency(overview?.platformEarnings || 0)}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Estimated marketplace take rate yield
                </p>
              </div>
            </div>

            {/* Card 3: Orders Lifecycle */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order Fulfillment
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {overview?.totalOrders || 0}
                </h3>
                <div className="flex gap-2 text-[11px] font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {overview?.deliveredOrders || 0} Done
                  </span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {overview?.pendingOrders || 0} Pend
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {overview?.cancelledOrders || 0} orders cancelled / refunded
              </p>
            </div>

            {/* Card 4: Sellers Network */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Merchant Partners
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {overview?.totalSellers || 0}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {overview?.activeSellers || 0} Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                <span>{overview?.pendingSellers || 0} Pending</span>
                <span>•</span>
                <span className="text-rose-600 font-semibold">{overview?.bannedSellers || 0} Banned</span>
              </div>
            </div>

            {/* Card 5: Customer Accounts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Customers
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {overview?.totalUsers || 0}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {overview?.activeUsers || 0} Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {overview?.bannedUsers || 0} user accounts banned
              </p>
            </div>

            {/* Card 6: Products in Catalog */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Catalog Items
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {overview?.totalProducts || 0}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Products listed across all sellers
                </p>
              </div>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-400 transition-all flex items-center justify-between group shadow-sm text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900">
                  Manage Customers
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Ban or unban accounts</p>
              </div>
              <ArrowForwardIcon sx={{ fontSize: 18, color: "#94A3B8" }} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/sellers")}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-400 transition-all flex items-center justify-between group shadow-sm text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900">
                  Sellers & Earnings
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Inspect revenue & ban sellers</p>
              </div>
              <ArrowForwardIcon sx={{ fontSize: 18, color: "#94A3B8" }} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-400 transition-all flex items-center justify-between group shadow-sm text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900">
                  Catalog Cleanup
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Remove any product from DB</p>
              </div>
              <ArrowForwardIcon sx={{ fontSize: 18, color: "#94A3B8" }} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/transactions")}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-400 transition-all flex items-center justify-between group shadow-sm text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900">
                  Transaction Ledger
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Full settlement logs</p>
              </div>
              <ArrowForwardIcon sx={{ fontSize: 18, color: "#94A3B8" }} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  Recent Marketplace Transactions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest buyer payments and merchant allocations
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/transactions")}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                View Full Ledger <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </button>
            </div>

            {overview?.recentTransactions && overview.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Transaction ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Seller Store</th>
                      <th className="pb-3">Order Total</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.recentTransactions.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 font-mono text-xs text-slate-600">
                          {tx._id?.substring(0, 10)}...
                        </td>
                        <td className="py-3.5 font-medium text-slate-800">
                          {tx.customer?.fullName || tx.customer?.email || "Buyer"}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {tx.seller?.businessDetails?.businessName || tx.seller?.sellerName || "Partner"}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          {formatCurrency(tx.order?.totalSellingPrice || 0)}
                        </td>
                        <td className="py-3.5 text-xs text-slate-500">
                          {new Date(tx.createdAt || tx.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircleOutlineIcon sx={{ fontSize: 12 }} />
                            Settled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No transaction records available yet. Orders placed by customers will appear here automatically.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOverviewDashboard;
