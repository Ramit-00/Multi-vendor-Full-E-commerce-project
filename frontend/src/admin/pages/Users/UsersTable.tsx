import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchAdminUsers,
  updateUserStatus,
  deleteUser,
} from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import SearchIcon from "@mui/icons-material/Search";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

const UsersTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.adminPlatform);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogUser, setDeleteDialogUser] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleToggleStatus = (user: any) => {
    const nextStatus = user.status === "BANNED" ? "ACTIVE" : "BANNED";
    dispatch(updateUserStatus({ id: user._id, status: nextStatus }));
  };

  const handleConfirmDelete = () => {
    if (deleteDialogUser) {
      dispatch(deleteUser(deleteDialogUser._id));
      setDeleteDialogUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Customer Users Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage normal registered buyer accounts, monitor order participation, and enforce bans or account removals.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
            <p className="text-xs text-slate-500 font-semibold">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No registered users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isBanned = user.status === "BANNED";
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isBanned ? "bg-rose-100 text-rose-700" : "bg-slate-900 text-white"
                          }`}>
                            {(user.fullName || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {user.fullName || "Valued Customer"}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {user._id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-medium text-slate-800">{user.email}</p>
                        <p className="text-slate-400 mt-0.5">{user.mobile || "No phone provided"}</p>
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {user.orderCount || 0} Orders
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <BlockIcon sx={{ fontSize: 12 }} />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircleOutlineIcon sx={{ fontSize: 12 }} />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                              isBanned
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            <BlockIcon sx={{ fontSize: 14 }} />
                            {isBanned ? "Unban User" : "Ban User"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteDialogUser(user)}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                            title="Delete user permanently"
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
        open={Boolean(deleteDialogUser)}
        onClose={() => setDeleteDialogUser(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1, maxWidth: 440 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "18px", color: "#0F172A" }}>
          Confirm User Account Deletion
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete the account for{" "}
            <strong>{deleteDialogUser?.fullName}</strong> ({deleteDialogUser?.email})?
          </p>
          <p className="text-xs text-rose-600 font-semibold mt-2">
            This action cannot be undone and will permanently remove this customer from the platform database.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogUser(null)}
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
    </div>
  );
};

export default UsersTable;
