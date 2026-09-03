// src/slices/cartSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Cart, type CartItem } from "../../types/cartTypes";
import { api } from "../../Config/Api";
import { applyCoupon } from "./CouponSlice";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const getStoredGuestCart = (): Cart | null => {
  try {
    const saved = localStorage.getItem("guest_cart");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // Ignore parse error
  }
  return null;
};

const saveGuestCart = (cart: Cart | null) => {
  try {
    if (cart) {
      localStorage.setItem("guest_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("guest_cart");
    }
  } catch (e) {
    // Ignore storage error
  }
};

const initialState: CartState = {
  cart: getStoredGuestCart(),
  loading: false,
  error: null,
};

// Define the base URL for the API
const API_URL = "/api/cart";

export const fetchUserCart = createAsyncThunk<Cart, string>(
  "cart/fetchUserCart",
  async (jwt: string, { rejectWithValue }) => {
    if (!jwt) {
      const guest = getStoredGuestCart();
      if (guest) return guest;
      return {
        _id: "guest_cart",
        user: {} as any,
        cartItems: [],
        totalSellingPrice: 0,
        totalMrpPrice: 0,
        totalItem: 0,
        discount: 0,
        couponCode: null,
        couponPrice: 0,
      };
    }
    try {
      const response = await api.get(API_URL, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Cart fetched ", response.data);
      return response.data;
    } catch (error: any) {
      const guest = getStoredGuestCart();
      if (guest) return guest;
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user cart");
    }
  }
);

export interface AddItemRequest {
  productId: string | undefined;
  size: string;
  quantity: number;
  product?: any;
}

export const addItemToCart = createAsyncThunk<
  CartItem,
  { jwt: string | null; request: AddItemRequest }
>("cart/addItemToCart", async ({ jwt, request }) => {
  if (jwt) {
    try {
      const response = await api.put(`${API_URL}/add`, request, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Cart added ", response.data);
      return response.data;
    } catch (error: any) {
      console.warn("Backend add cart item error, fallback to local:", error && error.message);
    }
  }

  // Local fallback (guest mode or offline)
  const product = request.product || {
    _id: request.productId,
    id: request.productId,
    title: "Selected Product",
    images: [],
    sellingPrice: 999,
    mrpPrice: 1499,
  };

  const qty = Number(request.quantity) || 1;
  const sellingPrice = qty * Number(product.sellingPrice || 999);
  const mrpPrice = qty * Number(product.mrpPrice || 1499);

  const localItem: CartItem = {
    _id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    product,
    size: request.size || "FREE",
    quantity: qty,
    mrpPrice,
    sellingPrice,
    userId: "guest",
  };

  return localItem;
});

export const deleteCartItem = createAsyncThunk<
  any,
  { jwt: string; cartItemId: any }
>("cart/deleteCartItem", async ({ jwt, cartItemId }) => {
  if (jwt && typeof cartItemId === "string" && !cartItemId.startsWith("item_")) {
    try {
      const response = await api.delete(`${API_URL}/item/${cartItemId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      console.warn("Backend deleteCartItem error, using local fallback");
    }
  }
  return { cartItemId, message: "Item removed" };
});

export const updateCartItem = createAsyncThunk<
  any,
  { jwt: string | null; cartItemId: any; cartItem: any }
>(
  "cart/updateCartItem",
  async ({ jwt, cartItemId, cartItem }) => {
    if (jwt && typeof cartItemId === "string" && !cartItemId.startsWith("item_")) {
      try {
        const response = await api.put(
          `${API_URL}/item/${cartItemId}`,
          cartItem,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        return response.data;
      } catch (error: any) {
        console.warn("Backend updateCartItem error, using local fallback");
      }
    }
    return { cartItemId, ...cartItem };
  }
);

const recalculateTotals = (cart: Cart): Cart => {
  let totalPrice = 0;
  let totalDiscountedPrice = 0;
  let totalItem = 0;

  (cart.cartItems || []).forEach((item) => {
    const qty = Number(item.quantity || 1);
    const unitMrp = Number(item.product?.mrpPrice || item.mrpPrice || 0);
    const unitSelling = Number(item.product?.sellingPrice || item.sellingPrice || 0);
    totalPrice += unitMrp > 0 ? unitMrp * qty : Number(item.mrpPrice || 0);
    totalDiscountedPrice += unitSelling > 0 ? unitSelling * qty : Number(item.sellingPrice || 0);
    totalItem += qty;
  });

  const discount = totalPrice > 0 ? Math.round(((totalPrice - totalDiscountedPrice) / totalPrice) * 100) : 0;

  return {
    ...cart,
    totalMrpPrice: totalPrice,
    totalSellingPrice: totalDiscountedPrice - (cart.couponPrice || 0),
    totalItem,
    discount,
  };
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCartState: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
      saveGuestCart(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserCart.fulfilled,
        (state, action: PayloadAction<Cart>) => {
          state.cart = recalculateTotals(action.payload);
          state.loading = false;
          saveGuestCart(state.cart);
        }
      )
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addItemToCart.fulfilled,
        (state, action: PayloadAction<CartItem>) => {
          if (!state.cart) {
            state.cart = {
              _id: "guest_cart",
              user: {} as any,
              cartItems: [action.payload],
              totalSellingPrice: action.payload.sellingPrice,
              totalMrpPrice: action.payload.mrpPrice,
              totalItem: action.payload.quantity,
              discount: 0,
              couponCode: null,
              couponPrice: 0,
            };
          } else {
            const prodId = action.payload.product?._id || (action.payload.product as any)?.id;
            const existingIdx = state.cart.cartItems.findIndex(
              (i) => (i.product?._id || (i.product as any)?.id) === prodId && i.size === action.payload.size
            );

            if (existingIdx > -1) {
              state.cart.cartItems[existingIdx].quantity += action.payload.quantity;
            } else {
              state.cart.cartItems.push(action.payload);
            }
          }
          if (state.cart) {
            state.cart = recalculateTotals(state.cart);
            saveGuestCart(state.cart);
          }
          state.loading = false;
        }
      )
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // cart item
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        if (state.cart) {
          const idToRemove = action.meta.arg.cartItemId;
          state.cart.cartItems = state.cart.cartItems.filter(
            (item: CartItem) => String(item._id) !== String(idToRemove)
          );
          state.cart = recalculateTotals(state.cart);
          saveGuestCart(state.cart);
        }
        state.loading = false;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        if (state.cart) {
          const targetId = action.meta.arg.cartItemId;
          const newQty = action.meta.arg.cartItem?.quantity;
          const item = state.cart.cartItems.find(
            (i: CartItem) => String(i._id) === String(targetId)
          );
          if (item && newQty) {
            item.quantity = newQty;
            item.sellingPrice = newQty * Number(item.product?.sellingPrice || 0);
            item.mrpPrice = newQty * Number(item.product?.mrpPrice || 0);
          }
          state.cart = recalculateTotals(state.cart);
          saveGuestCart(state.cart);
        }
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.cart = action.payload;
        saveGuestCart(state.cart);
        state.loading = false;
      });
  },
});

export const { resetCartState } = cartSlice.actions;
export default cartSlice.reducer;
