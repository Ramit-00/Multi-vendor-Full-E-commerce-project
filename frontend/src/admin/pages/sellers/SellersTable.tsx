import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchAdminSellers,
  updateSellerAccountStatus,
  deleteSeller,
  fetchSellerFinancials,
  clearSelectedSellerFinancials,
} from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import SellerFinancialModal from "./SellerFinancialModal";
import SearchIcon from "@mui/icons-material/Search";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";

const STATUS_TABS = [
  { label: "All Merchants", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING_VERIFICATION" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Banned", value: "BANNED" },
];

const SellersTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sellers, selectedSellerFinancials, actionLoading, loading } =
    useAppSelector((state) => state.adminPlatform);

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogSeller, setDeleteDialogSeller] = useState<any | null>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{
    [key: string]: HTMLElement | null;
  }>({});

  useEffect(() => {
    dispatch(fetchAdminSellers(activeTab));
  }, [activeTab, dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleOpenStatusMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setStatusMenuAnchor((prev) => ({ ...prev, [id]: e.currentTarget }));
  };

  const handleCloseStatusMenu = (id: string) => {
    setStatusMenuAnchor((prev) => ({ ...prev, [id]: null }));
  };

  const handleUpdateStatus = (id: string, status: string) => {
    dispatch(updateSellerAccountStatus({ id, status }));
    handleCloseStatusMenu(id);
  };

  const handleConfirmDelete = () => {
    if (deleteDialogSeller) {
      dispatch(deleteSeller(deleteDialogSeller._id));
      setDeleteDialogSeller(null);
    }
  };

  const handleInspectFinancials = (sellerId: string) => {
    dispatch(fetchSellerFinancials(sellerId));
  };

  const filteredSellers = sellers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.sellerName?.toLowerCase().includes(q) ||
      s.businessDetails?.businessName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.GSTIN?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Vendor Ecosystem
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Sellers & Merchant Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit seller partners, inspect revenue generation and settlement ledgers, and enforce merchant status.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sellers, stores, GSTIN..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
              activeTab === tab.value
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sellers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading && sellers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
            <p className="text-xs text-slate-500 font-semibold">Loading verified merchants...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No merchant partners found for this filter tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-5">Merchant Store</th>
                  <th className="py-3.5 px-4">Contact & GSTIN</th>
                  <th className="py-3.5 px-4">Catalog / Orders</th>
                  <th className="py-3.5 px-4">Gross Revenue</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.map((seller) => {
                  return (
                    <tr key={seller._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Merchant Identity */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-800 shrink-0">
                            {(seller.businessDetails?.businessName || seller.sellerName || "S")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {seller.businessDetails?.businessName || seller.sellerName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Partner: {seller.sellerName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & GSTIN */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-medium text-slate-800">{seller.email}</p>
                        <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                          GST: {seller.GSTIN}
                        </p>
                      </td>

                      {/* Store Volume */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-bold text-slate-800">
                          {seller.productCount || 0} Products
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {seller.orderCount || 0} Orders Received
                        </p>
                      </td>

                      {/* Revenue */}
                      <td className="py-4 px-4">
                        <span className="font-black text-sm text-slate-900">
                          {formatCurrency(seller.totalRevenue || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          seller.accountStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : seller.accountStatus === "BANNED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {seller.accountStatus === "ACTIVE" && <CheckCircleOutlineIcon sx={{ fontSize: 12 }} />}
                          {seller.accountStatus === "BANNED" && <BlockIcon sx={{ fontSize: 12 }} />}
                          {seller.accountStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Inspect Financials Button */}
                          <button
                            type="button"
                            onClick={() => handleInspectFinancials(seller._id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all flex items-center gap-1 shadow-sm"
                            title="Inspect Financials & Orders"
                          >
                            <AttachMoneyIcon sx={{ fontSize: 14, color: "#059669" }} />
                            Financials
                          </button>

                          {/* Status Dropdown */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenStatusMenu(e, seller._id)}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 transition-all"
                          >
                            Status
                          </button>

                          <Menu
                            anchorEl={statusMenuAnchor[seller._id]}
                            open={Boolean(statusMenuAnchor[seller._id])}
                            onClose={() => handleCloseStatusMenu(seller._id)}
                            PaperProps={{
                              sx: { borderRadius: "12px", minWidth: 160, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" },
                            }}
                          >
                            <MenuItem onClick={() => handleUpdateStatus(seller._id, "ACTIVE")} sx={{ fontSize: "12px", fontWeight: 600 }}>
                              Activate Merchant
                            </MenuItem>
                            <MenuItem onClick={() => handleUpdateStatus(seller._id, "SUSPENDED")} sx={{ fontSize: "12px", fontWeight: 600, color: "#D97706" }}>
                              Suspend Merchant
                            </MenuItem>
                            <MenuItem onClick={() => handleUpdateStatus(seller._id, "BANNED")} sx={{ fontSize: "12px", fontWeight: 600, color: "#DC2626" }}>
                              Ban Merchant
                            </MenuItem>
                            <MenuItem onClick={() => handleUpdateStatus(seller._id, "CLOSED")} sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                              Close Account
                            </MenuItem>
                          </Menu>

                          {/* Delete Seller Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteDialogSeller(seller)}
                            className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                            title="Delete Merchant Permanently"
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deleteDialogSeller)}
        onClose={() => setDeleteDialogSeller(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1, maxWidth: 440 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "18px", color: "#0F172A" }}>
          Confirm Merchant Account Deletion
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete the merchant partner account for{" "}
            <strong>
              {deleteDialogSeller?.businessDetails?.businessName || deleteDialogSeller?.sellerName}
            </strong>{" "}
            ({deleteDialogSeller?.email})?
          </p>
          <p className="text-xs text-rose-600 font-semibold mt-2">
            This action will remove the merchant record and revoke all active storefront authorizations.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogSeller(null)}
            sx={{ textTransform: "none", color: "#64748B", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "#DC2626",
              "&:hover": { backgroundColor: "#B91C1C" },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Financial Inspection Drawer */}
      <SellerFinancialModal
        data={selectedSellerFinancials}
        loading={actionLoading}
        onClose={() => dispatch(clearSelectedSellerFinancials())}
      />
    </div>
  );
};

export default SellersTable;
