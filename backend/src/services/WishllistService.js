const Wishlist = require('../models/Wishlist');
const ProductService = require('./ProductService');

class WishlistService {
    constructor() {
        this.fallbackWishlists = new Map();
    }

    _getUserId(user) {
        if (!user) return "guest_user";
        return String(user._id || user.id || user.email || "guest_user");
    }

    async _resolveProduct(productRef) {
        if (!productRef) return null;
        if (typeof productRef === 'object' && productRef.title && productRef.images) {
            return productRef;
        }
        const id = typeof productRef === 'object' ? (productRef._id || productRef.id) : productRef;
        try {
            const found = await ProductService.findProductById(String(id));
            return found ? (found.toObject ? found.toObject() : found) : null;
        } catch (e) {
            return null;
        }
    }

    async getWishlistByUserId(user) {
        const userId = this._getUserId(user);
        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        let wishlist = null;
        if (dbConnected) {
            try {
                wishlist = await Wishlist.findOne({ user: userId });
                if (!wishlist) {
                    wishlist = await new Wishlist({ user: userId, products: [] }).save();
                }
            } catch (dbErr) {
                console.warn("Wishlist DB find error, using fallback:", dbErr.message);
            }
        }

        if (!wishlist) {
            if (!this.fallbackWishlists.has(userId)) {
                this.fallbackWishlists.set(userId, {
                    _id: `wishlist_${userId}`,
                    user: userId,
                    products: []
                });
            }
            wishlist = this.fallbackWishlists.get(userId);
        }

        const wishlistObj = wishlist.toObject ? wishlist.toObject() : { ...wishlist };
        const rawProducts = wishlistObj.products || [];
        const populatedProducts = [];

        for (const p of rawProducts) {
            const resolved = await this._resolveProduct(p);
            if (resolved) {
                populatedProducts.push(resolved);
            }
        }

        wishlistObj.products = populatedProducts;
        return wishlistObj;
    }

    async addProductToWishlist(user, product) {
        const userId = this._getUserId(user);
        const resolvedProduct = await this._resolveProduct(product);
        if (!resolvedProduct) {
            throw new Error("Product not found");
        }

        const productId = String(resolvedProduct._id || resolvedProduct.id);
        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                let wishlist = await Wishlist.findOne({ user: userId });
                if (!wishlist) {
                    wishlist = new Wishlist({ user: userId, products: [] });
                }

                const existingIndex = (wishlist.products || []).findIndex(
                    p => String(p?._id || p?.id || p) === productId
                );

                if (existingIndex > -1) {
                    wishlist.products.splice(existingIndex, 1);
                } else {
                    wishlist.products.push(productId);
                }

                await wishlist.save();
                return await this.getWishlistByUserId(user);
            } catch (dbErr) {
                console.warn("DB addProductToWishlist error, using fallback:", dbErr.message);
            }
        }

        // Fallback store
        if (!this.fallbackWishlists.has(userId)) {
            this.fallbackWishlists.set(userId, {
                _id: `wishlist_${userId}`,
                user: userId,
                products: []
            });
        }

        const fallback = this.fallbackWishlists.get(userId);
        const existingIndex = fallback.products.findIndex(
            p => String(p?._id || p?.id || p) === productId
        );

        if (existingIndex > -1) {
            fallback.products.splice(existingIndex, 1);
        } else {
            fallback.products.push(resolvedProduct);
        }

        return await this.getWishlistByUserId(user);
    }
}

module.exports = new WishlistService();
