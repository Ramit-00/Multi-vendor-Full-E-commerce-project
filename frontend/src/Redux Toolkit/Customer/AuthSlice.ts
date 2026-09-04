// src/slices/authSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
   type AuthResponse,
    type LoginRequest,
    type SignupRequest,
    type ResetPasswordRequest,
    type ApiResponse,
    type AuthState,
} from '../../types/authTypes';
import { api } from '../../Config/Api';
import { type RootState } from '../Store';
import { resetUserState, fetchUserProfile } from './UserSlice';
import { resetCartState } from './CartSlice';
import { resetSellerProfile, fetchSellerProfile } from '../Seller/sellerSlice';
import axios from 'axios';


const initialState: AuthState = {
    jwt: null,
    role: null,
    loading: false,
    error: null,
    otpSent:false,
    mailSent: null,
    otp: null
};

// Define the base URL for the API
const API_URL = '/auth';

export const sendLoginSignupOtp = createAsyncThunk<ApiResponse, { email: string }>(
    'auth/sendLoginSignupOtp',
    async ({ email }, { rejectWithValue }) => {
        try {
            const response = await api.post(`${API_URL}/sent/login-signup-otp`, { email });
            console.log("otp sent successfully",response.data);
            return response.data;
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || error.message
                : 'Failed to send OTP';
            console.log("error --- ", error);
            return rejectWithValue(message);
        }
    }
);

export const signup = createAsyncThunk<AuthResponse, SignupRequest>(
    'auth/signup',
    async (signupRequest, { rejectWithValue, dispatch }) => {
        console.log("signup ", signupRequest);
        try {
            const response = await api.post<AuthResponse>(`${API_URL}/signup`, signupRequest);
            localStorage.setItem("customer_jwt", response.data.jwt);
            localStorage.setItem("jwt", response.data.jwt);
            localStorage.setItem("role", "ROLE_CUSTOMER");
            localStorage.setItem("customer_role", "ROLE_CUSTOMER");
            localStorage.removeItem("seller_jwt");
            localStorage.removeItem("seller_role");
            dispatch(resetSellerProfile());
            signupRequest.navigate("/");
            return response.data;
        } catch (error: any) {
            return rejectWithValue('Signup failed');
        }
    }
);

export const signin = createAsyncThunk<AuthResponse, LoginRequest>(
    'auth/signin',
    async (loginRequest, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post<any>(`${API_URL}/signin`, loginRequest);
            console.log("login successful", response.data);

            if (response.data.role === 'ROLE_SELLER' || response.data.isSeller) {
                localStorage.setItem("seller_jwt", response.data.jwt);
                localStorage.setItem("jwt", response.data.jwt);
                localStorage.setItem("role", "ROLE_SELLER");
                localStorage.setItem("seller_role", "ROLE_SELLER");
                dispatch(fetchSellerProfile(response.data.jwt));
                loginRequest.navigate("/seller/account");
            } else {
                localStorage.setItem("customer_jwt", response.data.jwt);
                localStorage.setItem("jwt", response.data.jwt);
                localStorage.setItem("role", "ROLE_CUSTOMER");
                localStorage.setItem("customer_role", "ROLE_CUSTOMER");
                localStorage.removeItem("seller_jwt");
                localStorage.removeItem("seller_role");
                dispatch(resetSellerProfile());
                loginRequest.navigate("/");
            }
            return response.data;
        } catch (error: any) {
            console.log("error ", error.response);
            return rejectWithValue('Signin failed');
        }
    }
);

export const googleAuthLogin = createAsyncThunk<
    AuthResponse,
    { credential: string; navigate: any }
>(
    'auth/googleAuthLogin',
    async ({ credential, navigate }, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post<any>(`${API_URL}/google`, { credential });
            console.log("Google Auth successful", response.data);

            const token = response.data.jwt;
            localStorage.setItem("customer_jwt", token);
            localStorage.setItem("jwt", token);
            localStorage.setItem("role", "ROLE_CUSTOMER");
            localStorage.setItem("customer_role", "ROLE_CUSTOMER");
            localStorage.removeItem("seller_jwt");
            localStorage.removeItem("seller_role");
            localStorage.removeItem("admin_jwt");
            dispatch(resetSellerProfile());
            dispatch(fetchUserProfile({ jwt: token, navigate }));
            navigate("/");
            return response.data;
        } catch (error: any) {
            console.log("Google Auth error", error.response?.data);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Google Sign-In failed';
            return rejectWithValue(msg);
        }
    }
);

export const resetPassword = createAsyncThunk<ApiResponse, ResetPasswordRequest>(
    'auth/resetPassword',
    async (resetPasswordRequest, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse>(`${API_URL}/reset-password`, resetPasswordRequest);
            return response.data;
        } catch (error:any) {
            return rejectWithValue('Reset password failed');
        }
    }
);

export const resetPasswordRequest = createAsyncThunk<ApiResponse, { email: string }>(
    'auth/resetPasswordRequest',
    async ({ email }, { rejectWithValue }) => {
        try {
            const response = await api.post<ApiResponse>(`${API_URL}/reset-password-request`, { email });
            return response.data;
        } catch (error:any) {
            return rejectWithValue('Reset password request failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.jwt = null;
            state.role = null;
            localStorage.clear()
        },
        resetAuthState: (state) => {
            state.otpSent = false;
            state.error = null;
            state.loading = false;
            state.otp = null;
            state.mailSent = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendLoginSignupOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.otpSent = false;
                state.mailSent = null;
                state.otp = null;
            })
            .addCase(sendLoginSignupOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.otpSent = true;
                // backend returns { message, otp?, mailSent }
                state.mailSent = (action.payload && typeof action.payload.mailSent !== 'undefined') ? action.payload.mailSent : null;
                state.otp = action.payload?.otp || null;
            })
            .addCase(sendLoginSignupOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(signup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signup.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.jwt = action.payload.jwt;
                state.role = action.payload.role;
                state.loading = false;
            })
            .addCase(signup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(signin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signin.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.jwt = action.payload.jwt;
                state.role = action.payload.role;
                state.loading = false;
            })
            .addCase(signin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(googleAuthLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleAuthLogin.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.jwt = action.payload.jwt;
                state.role = action.payload.role;
                state.loading = false;
            })
            .addCase(googleAuthLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(resetPasswordRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPasswordRequest.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resetPasswordRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, resetAuthState } = authSlice.actions;

export default authSlice.reducer;



export const performLogout = () => async (dispatch: any) => {
    localStorage.removeItem("customer_jwt");
    localStorage.removeItem("jwt");
    localStorage.removeItem("role");
    localStorage.removeItem("customer_role");
    dispatch(logout());
    dispatch(resetUserState());
    dispatch(resetCartState());
    dispatch(resetSellerProfile());
};

export const selectAuth = (state: RootState) => state.auth;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
