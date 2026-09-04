import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchAdminTransactions } from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CircularProgress } from "@mui/material";

const AdminTransactionsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { transactions, loading } = useAppSelector((state) => state.adminPlatform);

  useEffect(() => {
    dispatch(fetchAdminTransactions());
  }, [dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Financial Ledger
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
          Master Transactions Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete settlement history capturing customer payments, merchant revenue allocations, and payment gateway transactions.
        </p>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
            <p className="text-xs text-slate-500 font-semibold">Loading platform transaction ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No transaction records found. Transactions are recorded automatically upon checkout completion.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-5">Transaction Reference</th>
                  <th className="py-3.5 px-4">Customer Account</th>
                  <th className="py-3.5 px-4">Merchant Partner</th>
                  <th className="py-3.5 px-4">Order Value</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-900 font-bold">
                        <ReceiptLongIcon sx={{ fontSize: 16, color: "#64748B" }} />
                        {tx._id}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 pl-6">
                        Order Ref: {tx.order?._id || tx.order || "N/A"}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <p className="font-bold text-slate-900">
                        {tx.customer?.fullName || tx.customer?.email || "Customer"}
                      </p>
                      <p className="text-slate-400 mt-0.5">{tx.customer?.email || ""}</p>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <p className="font-bold text-slate-900">
                        {tx.seller?.businessDetails?.businessName || tx.seller?.sellerName || "Merchant"}
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Partner: {tx.seller?.sellerName || "Partner Store"}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-black text-sm text-slate-900">
                        {formatCurrency(tx.order?.totalSellingPrice || 0)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(tx.createdAt || tx.date).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircleOutlineIcon sx={{ fontSize: 12 }} />
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
  );
};

export default AdminTransactionsTable;
