// src/slices/userSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type User, type UserState, type Address } from "../../types/userTypes";
import { api } from "../../Config/Api";
import { type RootState } from "../Store";

const getSavedAddresses = (): Address[] => {
  try {
    const saved = localStorage.getItem("user_addresses");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
};

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
  { address: Address; jwt: string }
>(
  "user/saveUserAddress",
  async ({ address, jwt }) => {
    if (jwt) {
      try {
        const response = await api.post(`${API_URL}/address`, address, {
          headers: { Authorization: `Bearer ${jwt}` },
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
  { addressId: string; jwt: string }
>(
  "user/deleteUserAddress",
  async ({ addressId, jwt }) => {
    if (jwt) {
      try {
        await api.delete(`${API_URL}/address/${addressId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
      } catch (err: any) {
        console.warn("Backend delete address notice, deleting locally:", err.message);
      }
    }
    return addressId;
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
      try {
        if (state.user) {
          localStorage.setItem("user_addresses", JSON.stringify(state.user.addresses));
        }
      } catch (e) {}
    },
    removeLocalAddress: (state, action: PayloadAction<string>) => {
      if (state.user && Array.isArray(state.user.addresses)) {
        state.user.addresses = state.user.addresses.filter(
          (a) => String(a._id) !== String(action.payload)
        );
        try {
          if (state.user) {
            localStorage.setItem("user_addresses", JSON.stringify(state.user.addresses));
          }
        } catch (e) {}
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
          const userObj = { ...action.payload };
          const localAddrs = getSavedAddresses();
          if (localAddrs.length > 0) {
            const existingIds = new Set((userObj.addresses || []).map((a: any) => String(a._id || a)));
            const merged = [...(userObj.addresses || [])];
            for (const la of localAddrs) {
              if (!existingIds.has(String(la._id))) {
                merged.push(la);
              }
            }
            userObj.addresses = merged;
          }
          state.user = userObj;
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
            state.user.addresses.push(action.payload);
          }
          try {
            if (state.user) {
              localStorage.setItem("user_addresses", JSON.stringify(state.user.addresses));
            }
          } catch (e) {}
        }
      )
      .addCase(
        deleteUserAddress.fulfilled,
        (state, action: PayloadAction<string>) => {
          if (state.user && Array.isArray(state.user.addresses)) {
            state.user.addresses = state.user.addresses.filter(
              (a) => String(a._id) !== String(action.payload)
            );
            try {
              if (state.user) {
                localStorage.setItem("user_addresses", JSON.stringify(state.user.addresses));
              }
            } catch (e) {}
          }
        }
      );
  },
});

export const { resetUserState, addLocalAddress, removeLocalAddress } = userSlice.actions;

export default userSlice.reducer;

export const selectUser = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;
