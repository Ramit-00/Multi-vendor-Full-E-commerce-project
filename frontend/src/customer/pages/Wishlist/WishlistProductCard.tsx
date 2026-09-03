import React from "react";
import type { Product } from "../../../types/productTypes";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import CloseIcon from "@mui/icons-material/Close";
import { addProductToWishlist } from "../../../Redux Toolkit/Customer/WishlistSlice";
import { IconButton } from "@mui/material";
import { normalizeImageUrl } from "../../../util/imageUtil";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  item: Product;
}

const WishlistProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item._id) dispatch(addProductToWishlist({ productId: item._id }));
  };

  const imageSrc = item.images && item.images.length > 0 ? item.images[0] : "";

  return (
    <div
      onClick={() => navigate(`/product-details/all/${encodeURIComponent(item.title || "product")}/${item._id}`)}
      className="w-64 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col"
    >
      <div className="w-full h-64 bg-slate-50 relative overflow-hidden">
        <img
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          src={normalizeImageUrl(imageSrc)}
          alt={item.title}
          onError={(e: any) => {
            if (!e.currentTarget.src.includes("data:image")) {
              e.currentTarget.src = normalizeImageUrl(null);
            }
          }}
        />
        <div className="absolute top-2 right-2">
          <IconButton
            size="small"
            onClick={handleRemove}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(4px)",
              "&:hover": { backgroundColor: "#FFFFFF" },
            }}
          >
            <CloseIcon sx={{ color: "#64748B", fontSize: "1.2rem", "&:hover": { color: "#EF4444" } }} />
          </IconButton>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-900">
          {item.title}
        </h4>
        <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-900 text-sm">
              ₹{item.sellingPrice}
            </span>
            {item.mrpPrice > item.sellingPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{item.mrpPrice}
              </span>
            )}
          </div>
          {item.discountPercent && item.discountPercent > 0 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {item.discountPercent}% OFF
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WishlistProductCard;
