import { type Seller } from "./sellerTypes";

export interface Category {
    _id?: number; // Optional since id is auto-generated
    name: string;
    categoryId: string;
    parentCategory?: Category; // Optional since a category might not have a parent
    level: number;
  }

export interface Product {
    _id?: any; // Optional since id is auto-generated
    id?: any;
    title: string;
    description: string;
    mrpPrice: number;
    sellingPrice: number;
    discountPercent?: number;
    quantity?: number;
    color: string;
    images: string[]; // Array of strings for image URLs
    numRatings?: number;
    category?: Category; // Optional since a product might not have a category assigned yet
    seller?: Seller; // Placeholder for Seller interface (assuming it exists)
    createdAt?: Date; // Assuming LocalDateTime can be mapped to Date
    sizes: string[]; // Array of strings for product sizes
  }