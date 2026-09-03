// src/types/authTypes.ts
export interface AuthResponse {
    jwt: string;
    message: string;
    role: string;
}

export interface ApiResponse {
    message: string;
    status: boolean;
    mailSent?: boolean;
    otp?: string;
    previewUrl?: string | null;
    usedTestAccount?: boolean;
}

export interface LoginRequest {
    email: string;
    otp: string;
    navigate:any;
}

export interface SignupRequest {
    email: string;
    fullName: string;
    otp: string;
    navigate:any
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

export interface AuthState {
    jwt: string | null;
    role: string | null;
    loading: boolean;
    error: string | null;
    otpSent: boolean;
    mailSent: boolean | null;
    otp?: string | null;
}
