import {
  Alert,
  Button,
  IconButton,
  Snackbar,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CartItemCard from "./CartItemCard";
import { useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchUserCart } from "../../../Redux Toolkit/Customer/CartSlice";
import type { CartItem } from "../../../types/cartTypes";
import { applyCoupon } from "../../../Redux Toolkit/Customer/CouponSlice";
import { Close } from "@mui/icons-material";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart, auth, coupone } = useAppSelector((store) => store);
  const [couponCode, setCouponCode] = useState("");
  const [snackbarOpen, setOpenSnackbar] = useState(false);

  useEffect(() => {
    dispatch(fetchUserCart(localStorage.getItem("jwt") || ""));
  }, [auth.jwt]);

  const handleChange = (e: any) => {
    setCouponCode(e.target.value);
  };

  const handleApllyCoupon = (apply: string) => {
    // console.log(couponCode,apply)

    var code = couponCode;

    if (apply == "false") {
      code = cart.cart?.couponCode || "";
    }

    dispatch(
      applyCoupon({
        apply,
        code,
        orderValue: cart.cart?.totalSellingPrice || 100,
        jwt: localStorage.getItem("jwt") || "",
      })
    );
  };
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (coupone.couponApplied || coupone.error) {
      setOpenSnackbar(true);
      setCouponCode("");
    }
  }, [coupone.couponApplied, coupone.error]);

  console.log("cart ", coupone);
  return (
    <>
      {cart.cart && cart.cart?.cartItems.length !== 0 ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.cart?.cartItems.map((item: CartItem) => (
                <CartItemCard key={item._id} item={item} />
              ))}
            </div>

            <div className="col-span-1 text-sm space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex gap-2 text-sm items-center font-bold text-slate-800">
                  <LocalOfferIcon sx={{ color: "#0F172A", fontSize: "18px" }} />
                  <span>Promotions & Coupons</span>
                </div>
                {!cart.cart?.couponCode ? (
                  <div className="flex gap-2 items-center">
                    <TextField
                      value={couponCode}
                      onChange={handleChange}
                      placeholder="Enter coupon code"
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        },
                      }}
                    />
                    <Button
                      onClick={() => handleApllyCoupon("true")}
                      disabled={!couponCode}
                      variant="contained"
                      sx={{
                        backgroundColor: "#0F172A",
                        "&:hover": { backgroundColor: "#1E293B" },
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="py-1 px-3 border border-emerald-300 bg-emerald-50 rounded-full flex gap-2 items-center text-emerald-800 text-xs font-semibold">
                      <span>{cart.cart.couponCode} Applied</span>
                      <IconButton
                        onClick={() => handleApllyCoupon("false")}
                        size="small"
                        sx={{ p: 0.2 }}
                      >
                        <Close sx={{ fontSize: 14 }} className="text-emerald-800" />
                      </IconButton>
                    </div>
                  </div>
                )}
              </div>

              <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <PricingCard />
                <div className="p-5">
                  <Button
                    onClick={() => navigate("/checkout/address")}
                    sx={{
                      py: "12px",
                      backgroundColor: "#0F172A",
                      "&:hover": { backgroundColor: "#1E293B" },
                      fontWeight: 700,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontSize: "14px",
                    }}
                    variant="contained"
                    fullWidth
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </section>

              <div
                onClick={() => navigate("/wishlist")}
                className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span className="font-semibold text-xs text-slate-700">Add Items from Wishlist</span>
                <FavoriteIcon sx={{ color: "#EF4444", fontSize: "18px" }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[75vh] flex justify-center items-center flex-col px-4">
          <div className="text-center py-5 space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Shopping Bag is Empty</h1>
            <p className="text-slate-500 text-xs max-w-sm">
              Explore our wide variety of curated collections and add your favorite items to your shopping bag.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="contained"
              onClick={() => navigate("/products/all")}
              sx={{
                py: "10px",
                px: 3,
                backgroundColor: "#0F172A",
                "&:hover": { backgroundColor: "#1E293B" },
                fontWeight: 700,
                borderRadius: "10px",
                textTransform: "none",
              }}
            >
              Continue Shopping
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/wishlist")}
              sx={{
                py: "10px",
                px: 3,
                borderColor: "#CBD5E1",
                color: "#0F172A",
                fontWeight: 700,
                borderRadius: "10px",
                textTransform: "none",
                "&:hover": { borderColor: "#0F172A", backgroundColor: "#F8FAFC" }
              }}
            >
              View Wishlist
            </Button>
          </div>
        </div>
      )}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={coupone.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {coupone.error ? coupone.error : "Coupon Applied successfully"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Cart;
