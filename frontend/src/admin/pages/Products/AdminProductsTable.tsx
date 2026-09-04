import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchAdminProducts,
  adminDeleteProduct,
} from "../../../Redux Toolkit/Admin/AdminPlatformSlice";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

const AdminProductsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector((state) => state.adminPlatform);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProductTarget, setDeleteProductTarget] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchAdminProducts({ search: searchQuery }));
  };

  const handleConfirmDelete = () => {
    if (deleteProductTarget) {
      dispatch(adminDeleteProduct(deleteProductTarget._id));
      setDeleteProductTarget(null);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Catalog Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Marketplace Products Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global catalog inspection. Administrator authorization permits permanent deletion of non-compliant or fraudulent listings.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, brand, merchant..."
            className="w-full pl-10 pr-20 py-2 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
            <p className="text-xs text-slate-500 font-semibold">Loading marketplace catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No products found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-5">Product Listing</th>
                  <th className="py-3.5 px-4">Merchant Partner</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const imageSrc = p.images?.[0] || "/placeholder.png";
                  const sellerName =
                    p.seller?.businessDetails?.businessName ||
                    p.seller?.sellerName ||
                    "Merchant";

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={imageSrc}
                            alt={p.title}
                            className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-50"
                            onError={(e: any) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80";
                            }}
                          />
                          <div className="max-w-xs">
                            <p className="font-bold text-slate-950 text-xs leading-snug line-clamp-1">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-600">
                                {p.brand || "Brand"}
                              </span>
                              {p.color && (
                                <>
                                  <span>•</span>
                                  <span>{p.color}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-bold text-slate-800">{sellerName}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-mono">
                          ID: {p.seller?._id ? p.seller._id.substring(0, 8) : "N/A"}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {p.category?.name || p.category?.categoryId || "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            {formatCurrency(p.sellingPrice || 0)}
                          </span>
                          {p.mrpPrice > p.sellingPrice && (
                            <span className="line-through text-slate-400 text-[11px]">
                              {formatCurrency(p.mrpPrice)}
                            </span>
                          )}
                        </div>
                        {p.discountPercent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">
                            {p.discountPercent}% Off
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          (p.quantity || 10) > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {(p.quantity || 10) > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={`/product-details/${p.category?.categoryId || "all"}/${encodeURIComponent(p.title || "product")}/${p._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                            title="View on Storefront"
                          >
                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                          </a>

                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(p)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1 shadow-sm"
                            title="Remove Product From Database"
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            Delete
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
        open={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1, maxWidth: 440 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "18px", color: "#0F172A" }}>
          Confirm Catalog Product Deletion
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong>"{deleteProductTarget?.title}"</strong> from the marketplace catalog?
          </p>
          <p className="text-xs text-rose-600 font-semibold mt-2">
            This will permanently remove this item from search, active carts, and merchant listings.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteProductTarget(null)}
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
            Delete From Catalog
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminProductsTable;
