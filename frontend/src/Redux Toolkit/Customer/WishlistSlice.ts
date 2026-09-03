import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Wishlist } from "../../types/wishlistTypes";
import { type Product } from "../../types/productTypes";
import { api } from "../../Config/Api";

interface WishlistState {
  wishlist: Wishlist | null;
  loading: boolean;
  error: string | null;
}

const getStoredGuestWishlist = (): Wishlist | null => {
  try {
    const saved = localStorage.getItem("guest_wishlist");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // Ignore parse error
  }
  return null;
};

const saveGuestWishlist = (wishlist: Wishlist | null) => {
  try {
    if (wishlist) {
      localStorage.setItem("guest_wishlist", JSON.stringify(wishlist));
    } else {
      localStorage.removeItem("guest_wishlist");
    }
  } catch (e) {
    // Ignore storage error
  }
};

const initialState: WishlistState = {
  wishlist: getStoredGuestWishlist(),
  loading: false,
  error: null,
};

// Async Thunks
export const getWishlistByUserId = createAsyncThunk<Wishlist, string | undefined>(
  "wishlist/getWishlistByUserId",
  async (jwt: string | undefined) => {
    const token = jwt || localStorage.getItem("jwt");
    if (!token) {
      const guest = getStoredGuestWishlist();
      return guest || { _id: "guest_wishlist", user: {} as any, products: [] };
    }
    try {
      const response = await api.get(`/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("wishlist fetch ", response.data);
      return response.data;
    } catch (error: any) {
      console.warn("Backend getWishlistByUserId failed, fallback to local:", error && error.message);
      const guest = getStoredGuestWishlist();
      if (guest) return guest;
      return { _id: "guest_wishlist", user: {} as any, products: [] };
    }
  }
);

export const addProductToWishlist = createAsyncThunk<
  Wishlist,
  { productId: any; product?: any }
>(
  "wishlist/addProductToWishlist",
  async ({ productId, product }) => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const response = await api.post(
          `/api/wishlist/add-product/${productId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(" add product ", response.data);
        return response.data;
      } catch (error: any) {
        console.warn("Backend addProductToWishlist failed, fallback to local:", error && error.message);
      }
    }

    // Local fallback toggle
    const guest: Wishlist = getStoredGuestWishlist() || {
      _id: "guest_wishlist",
      user: {} as any,
      products: [],
    };

    const targetProduct: Product = product || {
      _id: productId,
      id: productId,
      title: "Saved Item",
      images: [],
      sellingPrice: 999,
      mrpPrice: 1499,
      color: "Default",
      sizes: ["FREE"],
      description: ""
    };

    const existingIdx = (guest.products || []).findIndex(
      (p: any) => String(p?._id || p?.id || p) === String(productId)
    );

    if (existingIdx > -1) {
      guest.products.splice(existingIdx, 1);
    } else {
      guest.products.push(targetProduct);
    }

    saveGuestWishlist(guest);
    return guest;
  }
);

// Slice
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    resetWishlistState: (state) => {
      state.wishlist = null;
      state.loading = false;
      state.error = null;
      saveGuestWishlist(null);
    },
  },
  extraReducers: (builder) => {
    // getWishlistByUserId
    builder.addCase(getWishlistByUserId.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getWishlistByUserId.fulfilled,
      (state, action: PayloadAction<Wishlist>) => {
        state.wishlist = action.payload;
        state.loading = false;
        saveGuestWishlist(state.wishlist);
      }
    );
    builder.addCase(
      getWishlistByUserId.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      }
    );

    // addProductToWishlist
    builder.addCase(addProductToWishlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addProductToWishlist.fulfilled,
      (state, action: PayloadAction<Wishlist>) => {
        state.wishlist = action.payload;
        state.loading = false;
        saveGuestWishlist(state.wishlist);
      }
    );
    builder.addCase(
      addProductToWishlist.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      }
    );
  },
});

export const { resetWishlistState } = wishlistSlice.actions;

export default wishlistSlice.reducer;
