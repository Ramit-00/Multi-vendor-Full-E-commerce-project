// src/types/addressTypes.ts
export interface Address {
    _id?: number;
    name: string;
    mobile: string;
    pinCode: string;
    address: string;
    locality: string;
    city: string;
    state: string;
}

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_SELLER';

export interface User {
    _id?: number;
    password?: string;
    email: string;
    fullName: string;
    mobile?: string;
    role: UserRole;
    addresses?: Address[];
}

export interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
    profileUpdated: boolean;
}