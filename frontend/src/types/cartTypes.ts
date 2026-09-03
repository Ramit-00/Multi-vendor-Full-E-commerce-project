import {type Product } from "./productTypes";
import {type User } from "./userTypes";

export interface CartItem {
    _id: any;
    cart?: Cart;
    product: Product;
    size: string;
    quantity: number;
    mrpPrice: number;
    sellingPrice: number;
    user_id?: any;
    userId?: any;
}


export interface Cart {
    _id: any;
    user: User;
    cartItems: CartItem[];
    totalSellingPrice: number;
    totalItem: number;
    totalMrpPrice: number;
    discount: number;
    couponCode: string | null;
    couponPrice?: number;
  }
