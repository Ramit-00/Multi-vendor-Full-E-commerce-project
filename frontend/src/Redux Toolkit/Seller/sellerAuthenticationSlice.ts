import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';
import axios from 'axios';

// Define initial state
interface SellerAuthState {
    otpSent: boolean;
    error: string | null;
    loading: boolean;
    jwt: string | null;
    sellerCreated: string | null;
    emailVerified: boolean;
    verifiedEmail: string | null;
    verifiedMobile: string | null;
    otp: string | null;
    forgotPasswordOtpSent: boolean;
    forgotPasswordSuccess: boolean;
    googleVerifiedSeller: { email: string; sellerName?: string } | null;
    notRegisteredError: boolean;
}

const initialState: SellerAuthState = {
    otpSent: false,
    error: null,
    loading: false,
    jwt: null,
    sellerCreated: "",
    emailVerified: false,
    verifiedEmail: null,
    verifiedMobile: null,
    otp: null,
    forgotPasswordOtpSent: false,
    forgotPasswordSuccess: false,
    googleVerifiedSeller: null,
    notRegisteredError: false,
};

const API_URL = '/sellers';

// Send OTP to email (and mobile)
export const sendSellerOtp = createAsyncThunk(
    'sellerAuth/sendSellerOtp',
    async ({ email, mobile }: { email: string; mobile?: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/sent/otp', { email, mobile });
            console.log("Seller OTP sent response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("sendSellerOtp error:", error);
            return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
        }
    }
);

// Verify Email OTP before registration
export const verifyEmailOtp = createAsyncThunk(
    'sellerAuth/verifyEmailOtp',
    async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/verify-email-otp', { email, otp });
            console.log("verifyEmailOtp success:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("verifyEmailOtp error:", error);
            return rejectWithValue(error.response?.data?.message || 'Invalid or expired OTP');
        }
    }
);

// Verify Google Email for Seller Registration (1-click verification)
export const verifySellerGoogleEmailRegistration = createAsyncThunk(
    'sellerAuth/verifySellerGoogleEmailRegistration',
    async ({ credential }: { credential: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/verify-google-email', { credential });
            console.log("verifySellerGoogleEmailRegistration success:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("verifySellerGoogleEmailRegistration error:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || 'Google verification failed');
        }
    }
);

// Define async thunks for sending and verifying OTP for login
export const sendLoginOtp = createAsyncThunk(
    'otp/sendLoginOtp',
    async ({ email, password }: { email: string; password?: string }, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/sellers/sent/login-otp', {
                email: email.trim().toLowerCase(),
                password: password || '',
            });
            console.log("Seller login OTP sent:", email, data);
            return { email: email.trim().toLowerCase(), mailSent: data.mailSent };
        } catch (error: any) {
            console.log("error", error);
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP');
        }
    }
);

// Define thunk for sending forgot password OTP
export const sendForgotPasswordOtp = createAsyncThunk(
    'sellerAuth/sendForgotPasswordOtp',
    async (email: string, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/sellers/forgot-password/sent-otp', {
                email: email.trim().toLowerCase(),
            });
            console.log("Forgot password OTP sent:", email, data);
            return { email: email.trim().toLowerCase(), mailSent: data.mailSent };
        } catch (error: any) {
            console.log("sendForgotPasswordOtp error:", error);
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to send reset code');
        }
    }
);

// Define thunk for resetting forgot password
export const resetForgotPassword = createAsyncThunk(
    'sellerAuth/resetForgotPassword',
    async ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/sellers/forgot-password/reset', {
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                newPassword,
            });
            console.log("Password reset success:", data);
            return data;
        } catch (error: any) {
            console.log("resetForgotPassword error:", error);
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to reset password');
        }
    }
);

export const verifyLoginOtp = createAsyncThunk(
    'otp/verifyLoginOtp', 
    async (data: { email: string; otp: string; navigate: any }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/verify/login-otp', data);
            console.log("login seller success - ", response.data);
            if (response.data.jwt) {
                localStorage.setItem("seller_jwt", response.data.jwt);
                localStorage.setItem("role", "ROLE_SELLER");
                localStorage.setItem("seller_role", "ROLE_SELLER");
            }
            if (data.navigate) {
                data.navigate("/seller");
            }
            return response.data;
        } catch (error: any) {
            console.log("error", error.response?.data);
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to verify OTP');
        }
    }
);

export const createSeller = createAsyncThunk<any, { seller: any; navigate?: any }>(
    'sellers/createSeller',
    async ({ seller, navigate }, { rejectWithValue }) => {
        try {
            const response = await api.post<any>(API_URL, seller);
            console.log('create seller success:', response.data);
            if (response.data.jwt) {
                localStorage.setItem("seller_jwt", response.data.jwt);
                localStorage.setItem("jwt", response.data.jwt);
                localStorage.setItem("role", "ROLE_SELLER");
                localStorage.setItem("seller_role", "ROLE_SELLER");
            }
            if (navigate) {
                navigate("/seller");
            }
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                console.error('Create seller error response data:', error.response.data);
                return rejectWithValue(error.response.data?.error || error.response.data?.message || error.message);
            } else {
                console.error('Create seller error message:', error.message);
                return rejectWithValue('Failed to create seller');
            }
        }
    }
);

// Verify Google Auth identity for Seller Login (Step 1)
export const verifySellerGoogleAuth = createAsyncThunk(
    'sellerAuth/verifySellerGoogleAuth',
    async ({ credential }: { credential: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/google/verify', { credential });
            console.log("Seller Google verification response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("verifySellerGoogleAuth error:", error.response?.data);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Google verification failed';
            return rejectWithValue(msg);
        }
    }
);

// Seller Password Login (Step 2 or Direct)
export const sellerPasswordLogin = createAsyncThunk(
    'sellerAuth/sellerPasswordLogin',
    async ({ email, password, navigate }: { email: string; password: string; navigate?: any }, { rejectWithValue }) => {
        try {
            const response = await api.post('/sellers/login/password', {
                email: email.trim().toLowerCase(),
                password,
            });
            console.log("Seller password login success:", response.data);
            if (response.data.jwt) {
                localStorage.setItem("seller_jwt", response.data.jwt);
                localStorage.setItem("jwt", response.data.jwt);
                localStorage.setItem("role", "ROLE_SELLER");
                localStorage.setItem("seller_role", "ROLE_SELLER");
                localStorage.removeItem("customer_jwt");
                localStorage.removeItem("customer_role");
                localStorage.removeItem("admin_jwt");
            }
            if (navigate) {
                navigate("/seller");
            }
            return response.data;
        } catch (error: any) {
            console.error("sellerPasswordLogin error:", error.response?.data);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Login failed';
            return rejectWithValue(msg);
        }
    }
);

// Create the slice
const sellerAuthSlice = createSlice({
    name: 'sellerAuth',
    initialState,
    reducers: {
        resetSellerAuthState: (state) => {
            state.otpSent = false;
            state.error = null;
            state.loading = false;
            state.jwt = null;
            state.sellerCreated = "";
            state.emailVerified = false;
            state.verifiedEmail = null;
            state.verifiedMobile = null;
            state.otp = null;
            state.forgotPasswordOtpSent = false;
            state.forgotPasswordSuccess = false;
            state.googleVerifiedSeller = null;
            state.notRegisteredError = false;
        },
        clearGoogleVerifiedSeller: (state) => {
            state.googleVerifiedSeller = null;
            state.error = null;
            state.notRegisteredError = false;
        },
        setVerifiedSellerInfo: (state, action: PayloadAction<{ email: string; mobile?: string }>) => {
            state.emailVerified = true;
            state.verifiedEmail = action.payload.email;
            if (action.payload.mobile) {
                state.verifiedMobile = action.payload.mobile;
            }
        }
    },
    extraReducers: (builder) => {
        // Handle sendSellerOtp
        builder
            .addCase(sendSellerOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendSellerOtp.fulfilled, (state) => {
                state.loading = false;
                state.otpSent = true;
                state.error = null;
            })
            .addCase(sendSellerOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Handle verifyEmailOtp
        builder
            .addCase(verifyEmailOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyEmailOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.emailVerified = true;
                state.verifiedEmail = action.payload.verifiedEmail;
                state.error = null;
            })
            .addCase(verifyEmailOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Handle verifySellerGoogleEmailRegistration
            .addCase(verifySellerGoogleEmailRegistration.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifySellerGoogleEmailRegistration.fulfilled, (state, action) => {
                state.loading = false;
                state.emailVerified = true;
                state.verifiedEmail = action.payload.verifiedEmail;
                state.error = null;
            })
            .addCase(verifySellerGoogleEmailRegistration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Handle sendLoginOtp actions
        builder
            .addCase(sendLoginOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.otpSent = false;
                state.otp = null;
            })
            .addCase(sendLoginOtp.fulfilled, (state) => {
                state.loading = false;
                state.otpSent = true;
                state.error = null;
            })
            .addCase(sendLoginOtp.rejected, (state, action) => {
                state.loading = false;
                state.otpSent = false;
                state.error = action.payload as string;
            });

        // Handle verifyLoginOtp actions
        builder
            .addCase(verifyLoginOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyLoginOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.jwt = action.payload.jwt;
                state.error = null;
            })
            .addCase(verifyLoginOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create new seller
            .addCase(createSeller.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSeller.fulfilled, (state, action) => {
                state.sellerCreated = "Seller registered and activated successfully!";
                state.jwt = action.payload.jwt;
                state.loading = false;
            })
            .addCase(createSeller.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to create seller';
            })
            // Handle sendForgotPasswordOtp
            .addCase(sendForgotPasswordOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.forgotPasswordOtpSent = false;
            })
            .addCase(sendForgotPasswordOtp.fulfilled, (state) => {
                state.loading = false;
                state.forgotPasswordOtpSent = true;
                state.error = null;
            })
            .addCase(sendForgotPasswordOtp.rejected, (state, action) => {
                state.loading = false;
                state.forgotPasswordOtpSent = false;
                state.error = action.payload as string;
            })
            // Handle resetForgotPassword
            .addCase(resetForgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.forgotPasswordSuccess = false;
            })
            .addCase(resetForgotPassword.fulfilled, (state) => {
                state.loading = false;
                state.forgotPasswordSuccess = true;
                state.forgotPasswordOtpSent = false;
                state.error = null;
            })
            .addCase(resetForgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.forgotPasswordSuccess = false;
                state.error = action.payload as string;
            })
            // Handle verifySellerGoogleAuth
            .addCase(verifySellerGoogleAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.notRegisteredError = false;
            })
            .addCase(verifySellerGoogleAuth.fulfilled, (state, action: any) => {
                state.loading = false;
                state.googleVerifiedSeller = {
                    email: action.payload.email,
                    sellerName: action.payload.sellerName || '',
                };
                state.error = null;
                state.notRegisteredError = false;
            })
            .addCase(verifySellerGoogleAuth.rejected, (state, action) => {
                state.loading = false;
                const errStr = (action.payload as string) || 'Google verification failed';
                state.error = errStr;
                state.notRegisteredError = errStr.toLowerCase().includes('not registered') || errStr.toLowerCase().includes('register');
            })
            // Handle sellerPasswordLogin
            .addCase(sellerPasswordLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sellerPasswordLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.jwt = action.payload.jwt;
                state.error = null;
            })
            .addCase(sellerPasswordLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export actions and reducer
export const { resetSellerAuthState, setVerifiedSellerInfo, clearGoogleVerifiedSeller } = sellerAuthSlice.actions;
export default sellerAuthSlice.reducer;
