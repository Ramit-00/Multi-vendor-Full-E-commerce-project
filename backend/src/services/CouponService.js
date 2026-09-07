const prisma = require('../config/prisma');
const Cart = require('../models/Cart');
const CouponNotValidException = require('../exceptions/CouponNotValidException');

function formatCoupon(coupon) {
  if (!coupon) return null;
  const isPercent = coupon.discountType === 'PERCENTAGE';
  return {
    id: coupon.id,
    _id: coupon.id,
    code: coupon.code,
    discountPercentage: isPercent ? Number(coupon.discountValue) : 10,
    discountValue: Number(coupon.discountValue),
    discountType: coupon.discountType,
    usesLeft: coupon.usesLeft,
    validityEndDate: coupon.expiryDate,
    expiryDate: coupon.expiryDate,
    minimumOrderValue: 0,
    active: coupon.usesLeft > 0 && new Date() <= coupon.expiryDate,
    createdAt: coupon.createdAt,
  };
}

const couponService = {
  /**
   * Apply a coupon to the user's cart
   */
  async applyCoupon(code, orderValue, user) {
    try {
      const cleanCode = String(code || '').trim().toUpperCase();
      const userId = String(user.id || user._id || user);

      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (!coupon) {
        throw new CouponNotValidException('Coupon not found');
      }

      const currentDate = new Date();
      if (currentDate > coupon.expiryDate) {
        throw new CouponNotValidException('Coupon expired');
      }

      if (coupon.usesLeft <= 0) {
        throw new CouponNotValidException('Coupon usage limit reached');
      }

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new CouponNotValidException('Active shopping cart not found');
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.round((cart.totalSellingPrice * Number(coupon.discountValue)) / 100);
      } else {
        discount = Math.min(cart.totalSellingPrice, Number(coupon.discountValue));
      }

      // Atomically decrement coupon uses
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usesLeft: { decrement: 1 } },
      });

      cart.totalSellingPrice = Math.max(0, cart.totalSellingPrice - discount);
      cart.couponCode = cleanCode;
      cart.couponPrice = discount;

      return await cart.save();
    } catch (error) {
      if (error instanceof CouponNotValidException) throw error;
      throw new Error(error.message);
    }
  },

  async removeCoupon(code, user) {
    try {
      const cleanCode = String(code || '').trim().toUpperCase();
      const userId = String(user.id || user._id || user);

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Re-increment coupon uses if it exists
      try {
        await prisma.coupon.update({
          where: { code: cleanCode },
          data: { usesLeft: { increment: 1 } },
        });
      } catch (e) {}

      cart.totalSellingPrice += (cart.couponPrice || 0);
      cart.couponCode = null;
      cart.couponPrice = 0;

      return await cart.save();
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async createCoupon(couponData) {
    try {
      const code = String(couponData.code || `COUPON_${Date.now()}`).toUpperCase().trim();
      const discountValue = Number(couponData.discountPercentage || couponData.discountValue || 10);
      const discountType = couponData.discountType || 'PERCENTAGE';
      const usesLeft = Number(couponData.usesLeft || couponData.maxUses || 100);
      const expiryDate = couponData.validityEndDate || couponData.expiryDate
        ? new Date(couponData.validityEndDate || couponData.expiryDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const created = await prisma.coupon.create({
        data: {
          code,
          discountType,
          discountValue,
          usesLeft,
          expiryDate,
        },
      });

      return formatCoupon(created);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async deleteCoupon(couponId) {
    try {
      await prisma.coupon.delete({
        where: { id: String(couponId) },
      });
      return { message: 'Coupon deleted successfully' };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async getAllCoupons() {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return coupons.map(formatCoupon);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async getCouponById(couponId) {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id: String(couponId) },
      });
      if (!coupon) throw new Error('Coupon not found');
      return formatCoupon(coupon);
    } catch (error) {
      throw new Error('Coupon not found');
    }
  },
};

module.exports = couponService;
