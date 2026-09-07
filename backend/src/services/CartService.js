const CartItem = require("../models/CartItem");
const Cart = require("../models/Cart");
const ProductService = require("./ProductService");

class CartService {
  constructor() {
    this.fallbackCarts = new Map();
  }

  _getUserId(user) {
    if (!user) return "guest_user";
    return String(user._id || user.id || user.email || "guest_user");
  }

  calculateDiscountPercentage(mrpPrice, sellingPrice) {
    if (mrpPrice <= 0) return 0;
    const discount = mrpPrice - sellingPrice;
    return Math.round((discount / mrpPrice) * 100);
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

  async findUserCart(user) {
    const userId = this._getUserId(user);
    const mongoose = require('mongoose');
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    let cart = null;

    if (dbConnected) {
      try {
        cart = await Cart.findOne({ user: userId });
        if (!cart) {
          const newCart = new Cart({ user: userId, cartItems: [] });
          cart = await newCart.save();
        }
      } catch (dbErr) {
        console.warn("Cart DB find error, using fallback:", dbErr.message);
      }
    }

    if (!cart) {
      if (!this.fallbackCarts.has(userId)) {
        this.fallbackCarts.set(userId, {
          _id: `cart_${userId}`,
          user: userId,
          cartItems: [],
          totalSellingPrice: 0,
          totalMrpPrice: 0,
          totalItem: 0,
          discount: 0,
          couponCode: null,
          couponPrice: 0
        });
      }
      cart = this.fallbackCarts.get(userId);
    }

    // Resolve cart items
    let resolvedCartItems = [];
    if (dbConnected && cart._id && !String(cart._id).startsWith('cart_')) {
      try {
        const items = await CartItem.find({ cart: cart._id });
        for (const it of items) {
          const itemObj = it.toObject ? it.toObject() : it;
          const populatedProduct = await this._resolveProduct(itemObj.product);
          if (populatedProduct) {
            itemObj.product = populatedProduct;
            resolvedCartItems.push(itemObj);
          }
        }
      } catch (err) {
        console.warn("Error fetching DB cart items:", err.message);
      }
    } else {
      for (const it of (cart.cartItems || [])) {
        const itemObj = { ...it };
        const populatedProduct = await this._resolveProduct(itemObj.product);
        if (populatedProduct) {
          itemObj.product = populatedProduct;
          resolvedCartItems.push(itemObj);
        }
      }
    }

    // Calculate totals
    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItem = 0;

    resolvedCartItems.forEach((item) => {
      totalPrice += Number(item.mrpPrice || 0);
      totalDiscountedPrice += Number(item.sellingPrice || 0);
      totalItem += Number(item.quantity || 1);
    });

    const cartObj = cart.toObject ? cart.toObject() : { ...cart };
    cartObj.cartItems = resolvedCartItems;
    cartObj.totalMrpPrice = totalPrice;
    cartObj.totalSellingPrice = totalDiscountedPrice - (cartObj.couponPrice || 0);
    cartObj.totalItem = totalItem;
    cartObj.discount = this.calculateDiscountPercentage(totalPrice, totalDiscountedPrice);

    return cartObj;
  }

  async addCartItem(user, product, size = "FREE", quantity = 1) {
    const userId = this._getUserId(user);
    const resolvedProduct = await this._resolveProduct(product);
    if (!resolvedProduct) {
      throw new Error("Product not found");
    }

    const productId = String(resolvedProduct._id || resolvedProduct.id);
    const itemQty = Number(quantity) || 1;
    const itemSize = size || "FREE";
    const itemSellingPrice = itemQty * Number(resolvedProduct.sellingPrice || 0);
    const itemMrpPrice = itemQty * Number(resolvedProduct.mrpPrice || 0);

    const mongoose = require('mongoose');
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    let cart = null;
    if (dbConnected) {
      try {
        cart = await Cart.findOne({ user: userId });
        if (!cart) {
          cart = await new Cart({ user: userId, cartItems: [] }).save();
        }

        // Check if item already exists in cart
        let existingItem = await CartItem.findOne({
          cart: cart._id,
          product: productId,
          size: itemSize,
        });

        if (existingItem) {
          existingItem.quantity += itemQty;
          existingItem.sellingPrice = existingItem.quantity * Number(resolvedProduct.sellingPrice || 0);
          existingItem.mrpPrice = existingItem.quantity * Number(resolvedProduct.mrpPrice || 0);
          await existingItem.save();
          const itemObj = existingItem.toObject();
          itemObj.product = resolvedProduct;
          return itemObj;
        }

        const newCartItem = new CartItem({
          product: productId,
          quantity: itemQty,
          userId: userId,
          sellingPrice: itemSellingPrice,
          mrpPrice: itemMrpPrice,
          size: itemSize,
          cart: cart._id,
        });
        await newCartItem.save();

        await Cart.findByIdAndUpdate(cart._id, { $push: { cartItems: newCartItem._id } });

        const itemObj = newCartItem.toObject();
        itemObj.product = resolvedProduct;
        return itemObj;
      } catch (dbErr) {
        console.warn("DB addCartItem error, using fallback:", dbErr.message);
      }
    }

    // Fallback store
    if (!this.fallbackCarts.has(userId)) {
      this.fallbackCarts.set(userId, {
        _id: `cart_${userId}`,
        user: userId,
        cartItems: [],
        totalSellingPrice: 0,
        totalMrpPrice: 0,
        totalItem: 0,
        discount: 0
      });
    }

    const fallbackCart = this.fallbackCarts.get(userId);
    const existingIndex = fallbackCart.cartItems.findIndex(
      (item) => String(item.product?._id || item.product?.id || item.product) === productId && item.size === itemSize
    );

    if (existingIndex > -1) {
      fallbackCart.cartItems[existingIndex].quantity += itemQty;
      fallbackCart.cartItems[existingIndex].sellingPrice =
        fallbackCart.cartItems[existingIndex].quantity * Number(resolvedProduct.sellingPrice || 0);
      fallbackCart.cartItems[existingIndex].mrpPrice =
        fallbackCart.cartItems[existingIndex].quantity * Number(resolvedProduct.mrpPrice || 0);
      return fallbackCart.cartItems[existingIndex];
    }

    const newFallbackItem = {
      _id: `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product: resolvedProduct,
      quantity: itemQty,
      userId,
      sellingPrice: itemSellingPrice,
      mrpPrice: itemMrpPrice,
      size: itemSize,
      cart: fallbackCart._id,
      createdAt: new Date()
    };

    fallbackCart.cartItems.push(newFallbackItem);
    return newFallbackItem;
  }

  async clearCart(user) {
    const userId = this._getUserId(user);
    try {
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        await CartItem.deleteMany({ cart: cart._id });
        cart.cartItems = [];
        cart.totalSellingPrice = 0;
        cart.totalMrpPrice = 0;
        cart.totalItem = 0;
        cart.discount = 0;
        cart.couponCode = null;
        cart.couponPrice = 0;
        await cart.save();
      }
    } catch (e) {
      console.warn('[CartService] clearCart notice:', e.message);
    }
    if (this.fallbackCarts.has(userId)) {
      const fc = this.fallbackCarts.get(userId);
      fc.cartItems = [];
      fc.totalSellingPrice = 0;
      fc.totalMrpPrice = 0;
      fc.totalItem = 0;
      fc.discount = 0;
      fc.couponCode = null;
      fc.couponPrice = 0;
    }
  }
}

module.exports = new CartService();
