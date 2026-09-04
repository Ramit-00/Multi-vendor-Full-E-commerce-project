import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";

export interface PlatformOverview {
  totalGMV: number;
  totalMrp: number;
  platformEarnings: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSellers: number;
  activeSellers: number;
  pendingSellers: number;
  suspendedSellers: number;
  bannedSellers: number;
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalProducts: number;
  recentTransactions: any[];
}

export interface AdminUserState {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  accountType: string;
  status: "ACTIVE" | "BANNED" | "SUSPENDED";
  orderCount?: number;
  createdAt: string;
}

export interface AdminSellerState {
  _id: string;
  sellerName: string;
  email: string;
  mobile: string;
  GSTIN: string;
  accountStatus: string;
  businessDetails?: any;
  bankDetails?: any;
  pickupAddress?: any;
  productCount?: number;
  orderCount?: number;
  totalRevenue?: number;
  createdAt: string;
}

interface AdminPlatformState {
  adminJwt: string | null;
  adminProfile: any | null;
  overview: PlatformOverview | null;
  users: AdminUserState[];
  sellers: AdminSellerState[];
  selectedSellerFinancials: any | null;
  products: any[];
  transactions: any[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AdminPlatformState = {
  adminJwt: localStorage.getItem("admin_jwt"),
  adminProfile: null,
  overview: null,
  users: [],
  sellers: [],
  selectedSellerFinancials: null,
  products: [],
  transactions: [],
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

// Helper to get auth header with admin_jwt
const getAdminAuthHeaders = () => {
  const token = localStorage.getItem("admin_jwt");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 1. Admin Master Key Login
export const adminLogin = createAsyncThunk<
  any,
  { email: string; password: string; adminSecretKey: string; navigate?: any },
  { rejectValue: string }
>("adminPlatform/adminLogin", async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post("/admin/auth/login", credentials);
    if (res.data && res.data.jwt) {
      // Purge all customer and seller credentials to guarantee clean session isolation
      localStorage.removeItem("seller_jwt");
      localStorage.removeItem("customer_jwt");
      localStorage.removeItem("jwt");
      localStorage.removeItem("seller_role");

      localStorage.setItem("admin_jwt", res.data.jwt);
      localStorage.setItem("role", "ROLE_ADMIN");
      if (credentials.navigate) {
        credentials.navigate("/admin");
      }
    }
    return res.data;
  } catch (err: any) {
    const msg = err.response?.data?.message || err.response?.data?.error || "Admin authentication failed";
    return rejectWithValue(msg);
  }
});

// 2. Fetch Platform Overview & Financials
export const fetchPlatformOverview = createAsyncThunk<
  PlatformOverview,
  void,
  { rejectValue: string }
>("adminPlatform/fetchPlatformOverview", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/admin/stats/overview", getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch overview");
  }
});

// 3. Fetch All Users
export const fetchAdminUsers = createAsyncThunk<
  AdminUserState[],
  void,
  { rejectValue: string }
>("adminPlatform/fetchAdminUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/admin/users", getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
  }
});

// 4. Update User Status (Ban / Activate)
export const updateUserStatus = createAsyncThunk<
  any,
  { id: string; status: "ACTIVE" | "BANNED" | "SUSPENDED" },
  { rejectValue: string }
>("adminPlatform/updateUserStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/admin/users/${id}/status`, { status }, getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to update user status");
  }
});

// 5. Delete User
export const deleteUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("adminPlatform/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/users/${id}`, getAdminAuthHeaders());
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete user");
  }
});

// 6. Fetch All Sellers
export const fetchAdminSellers = createAsyncThunk<
  AdminSellerState[],
  string | undefined,
  { rejectValue: string }
>("adminPlatform/fetchAdminSellers", async (status, { rejectWithValue }) => {
  try {
    const url = status && status !== "ALL" ? `/admin/sellers?status=${status}` : "/admin/sellers";
    const res = await api.get(url, getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch sellers");
  }
});

// 7. Update Seller Account Status (Ban, Suspend, Activate)
export const updateSellerAccountStatus = createAsyncThunk<
  any,
  { id: string; status: string },
  { rejectValue: string }
>("adminPlatform/updateSellerAccountStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/admin/sellers/${id}/status`, { status }, getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to update seller status");
  }
});

// 8. Delete Seller
export const deleteSeller = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("adminPlatform/deleteSeller", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/sellers/${id}`, getAdminAuthHeaders());
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete seller");
  }
});

// 9. Fetch Seller Financials Deep Dive
export const fetchSellerFinancials = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("adminPlatform/fetchSellerFinancials", async (sellerId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/admin/sellers/${sellerId}/financials`, getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to load seller financials");
  }
});

// 10. Fetch All Products
export const fetchAdminProducts = createAsyncThunk<
  any[],
  { search?: string; category?: string } | undefined,
  { rejectValue: string }
>("adminPlatform/fetchAdminProducts", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category && params.category !== "ALL") query.append("category", params.category);

    const res = await api.get(`/admin/products?${query.toString()}`, getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
  }
});

// 11. Delete Any Product
export const adminDeleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("adminPlatform/adminDeleteProduct", async (productId, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/products/${productId}`, getAdminAuthHeaders());
    return productId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete product");
  }
});

// 12. Fetch Master Transactions Ledger
export const fetchAdminTransactions = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("adminPlatform/fetchAdminTransactions", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/admin/transactions", getAdminAuthHeaders());
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch transactions");
  }
});

const adminPlatformSlice = createSlice({
  name: "adminPlatform",
  initialState,
  reducers: {
    adminLogout: (state) => {
      localStorage.removeItem("admin_jwt");
      if (localStorage.getItem("role") === "ROLE_ADMIN") {
        localStorage.removeItem("role");
      }
      state.adminJwt = null;
      state.adminProfile = null;
      state.overview = null;
      state.users = [];
      state.sellers = [];
      state.products = [];
      state.transactions = [];
      state.selectedSellerFinancials = null;
    },
    clearAdminError: (state) => {
      state.error = null;
    },
    clearAdminSuccess: (state) => {
      state.successMessage = null;
    },
    clearSelectedSellerFinancials: (state) => {
      state.selectedSellerFinancials = null;
    },
  },
  extraReducers: (builder) => {
    // adminLogin
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.adminJwt = action.payload.jwt;
        state.adminProfile = action.payload.admin;
        state.successMessage = "Authenticated as Administrator";
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });

    // fetchPlatformOverview
    builder
      .addCase(fetchPlatformOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlatformOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchPlatformOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load overview";
      });

    // fetchAdminUsers
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch users";
      });

    // updateUserStatus
    builder
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const updated = action.payload.user;
        state.users = state.users.map((u) => (u._id === updated._id ? { ...u, status: updated.status } : u));
        state.successMessage = action.payload.message || "User status updated";
      });

    // deleteUser
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
        state.successMessage = "User deleted successfully";
      });

    // fetchAdminSellers
    builder
      .addCase(fetchAdminSellers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(fetchAdminSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch sellers";
      });

    // updateSellerAccountStatus
    builder
      .addCase(updateSellerAccountStatus.fulfilled, (state, action) => {
        const updated = action.payload.seller;
        state.sellers = state.sellers.map((s) => (s._id === updated._id ? { ...s, accountStatus: updated.accountStatus } : s));
        state.successMessage = action.payload.message || "Seller status updated";
      });

    // deleteSeller
    builder
      .addCase(deleteSeller.fulfilled, (state, action) => {
        state.sellers = state.sellers.filter((s) => s._id !== action.payload);
        state.successMessage = "Seller deleted successfully";
      });

    // fetchSellerFinancials
    builder
      .addCase(fetchSellerFinancials.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(fetchSellerFinancials.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedSellerFinancials = action.payload;
      })
      .addCase(fetchSellerFinancials.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to load financials";
      });

    // fetchAdminProducts
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch products";
      });

    // adminDeleteProduct
    builder
      .addCase(adminDeleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
        state.successMessage = "Product removed from marketplace catalog";
      });

    // fetchAdminTransactions
    builder
      .addCase(fetchAdminTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchAdminTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch transactions";
      });
  },
});

export const {
  adminLogout,
  clearAdminError,
  clearAdminSuccess,
  clearSelectedSellerFinancials,
} = adminPlatformSlice.actions;

export default adminPlatformSlice.reducer;
