// src/slices/userSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type User, type UserState, type Address } from "../../types/userTypes";
import { api } from "../../Config/Api";
import { type RootState } from "../Store";

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  profileUpdated: false,
};

// Define the base URL for the API
const API_URL = "/api/users";

export const fetchUserProfile = createAsyncThunk<
  User,
  { jwt: string; navigate: any }
>(
  "user/fetchUserProfile",
  async (
    { jwt, navigate }: { jwt: string; navigate: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log(" user profile ", response.data);
      if (response.data.role === "ROLE_ADMIN") {
        navigate("/admin");
      }
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue("Failed to fetch user profile");
    }
  }
);

export const saveUserAddress = createAsyncThunk<
  Address,
  { address: Address; jwt?: string }
>(
  "user/saveUserAddress",
  async ({ address, jwt }) => {
    const token = jwt || localStorage.getItem("jwt") || localStorage.getItem("customer_jwt") || "";
    if (token) {
      try {
        const response = await api.post(`${API_URL}/address`, address, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err: any) {
        console.warn("Backend save address error, fallback to local:", err.message);
      }
    }
    const fallback: Address = {
      ...address,
      _id: address._id || (`addr_${Date.now()}` as any),
    };
    return fallback;
  }
);

export const deleteUserAddress = createAsyncThunk<
  string,
  { addressId: string; jwt?: string }
>(
  "user/deleteUserAddress",
  async ({ addressId, jwt }) => {
    const token = jwt || localStorage.getItem("jwt") || localStorage.getItem("customer_jwt") || "";
    if (token) {
      try {
        await api.delete(`${API_URL}/address/${addressId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: any) {
        console.warn("Backend delete address notice, deleting locally:", err.message);
      }
    }
    return addressId;
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  { fullName?: string; mobile?: string; jwt?: string }
>(
  "user/updateUserProfile",
  async ({ fullName, mobile, jwt }) => {
    const token = jwt || localStorage.getItem("customer_jwt") || localStorage.getItem("jwt");
    try {
      const response = await api.patch(`${API_URL}/profile`, { fullName, mobile }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (err: any) {
      console.warn("Update user profile API warning:", err.message);
      return { fullName: fullName || "", mobile: mobile || "" } as any;
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.profileUpdated = false;
    },
    addLocalAddress: (state, action: PayloadAction<Address>) => {
      if (!state.user) {
        state.user = {
          _id: "user_current",
          fullName: "Customer",
          email: "customer@example.com",
          role: "ROLE_CUSTOMER",
          addresses: [action.payload],
        } as any;
      } else {
        if (!Array.isArray(state.user.addresses)) {
          state.user.addresses = [];
        }
        state.user.addresses.push(action.payload);
      }
    },
    removeLocalAddress: (state, action: PayloadAction<string>) => {
      if (state.user && Array.isArray(state.user.addresses)) {
        state.user.addresses = state.user.addresses.filter(
          (a) => String(a._id) !== String(action.payload)
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.user = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(
        saveUserAddress.fulfilled,
        (state, action: PayloadAction<Address>) => {
          if (!state.user) {
            state.user = {
              _id: "user_current",
              fullName: "Customer",
              email: "customer@example.com",
              role: "ROLE_CUSTOMER",
              addresses: [action.payload],
            } as any;
          } else {
            if (!Array.isArray(state.user.addresses)) {
              state.user.addresses = [];
            }
            const exists = state.user.addresses.some(
              (a) => String(a._id) === String(action.payload._id)
            );
            if (!exists) {
              state.user.addresses.push(action.payload);
            }
          }
        }
      )
      .addCase(
        deleteUserAddress.fulfilled,
        (state, action: PayloadAction<string>) => {
          if (state.user && Array.isArray(state.user.addresses)) {
            state.user.addresses = state.user.addresses.filter(
              (a) => String(a._id) !== String(action.payload)
            );
          }
        }
      )
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.profileUpdated = false;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<any>) => {
          if (state.user) {
            state.user = {
              ...state.user,
              ...action.payload,
            };
          } else {
            state.user = action.payload;
          }
          state.loading = false;
          state.profileUpdated = true;
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update profile";
      });
  },
});

export const { resetUserState, addLocalAddress, removeLocalAddress } = userSlice.actions;

export default userSlice.reducer;

export const selectUser = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;
