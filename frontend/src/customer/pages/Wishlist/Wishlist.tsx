import { useEffect } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { getWishlistByUserId } from "../../../Redux Toolkit/Customer/WishlistSlice";
import WishlistProductCard from "./WishlistProductCard";

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { wishlist } = useAppSelector((store) => store);

  useEffect(() => {
    dispatch(getWishlistByUserId(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  const products = wishlist.wishlist?.products || [];

  return (
    <div className="min-h-[80vh] px-4 sm:px-8 lg:px-20 py-10 bg-[#FAFAFA]">
      {products.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                My Wishlist
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {products.length} {products.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/products/all")}
              sx={{
                borderColor: "#CBD5E1",
                color: "#0F172A",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" },
              }}
            >
              Continue Shopping
            </Button>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((item: any, idx: number) => (
              <WishlistProductCard key={item._id || item.id || idx} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-sm">
            <FavoriteBorderIcon sx={{ fontSize: 36, color: "#0F172A" }} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
            Explore our curated catalog and tap the heart icon on any product to save your favorites here.
          </p>
          <Button
            variant="contained"
            onClick={() => navigate("/products/all")}
            sx={{
              backgroundColor: "#0F172A",
              "&:hover": { backgroundColor: "#1E293B" },
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: "10px",
            }}
          >
            Explore Catalog
          </Button>
        </div>
      )}
    </div>
  );
};

export default Wishlist;