const Review = require("../models/Review");
const createError = require("http-errors");
const ProductService = require("./ProductService");
const UserService = require("./UserService");

class ReviewService {
  async createReview(reqBody, user, productId) {
    const product = await ProductService.findProductById(productId);
    const userId = String(user.id || user._id);
    const prodId = String(product.id || product._id);

    // Verified Purchaser verification: check if user has purchased this product
    let isVerifiedPurchase = false;
    try {
      const prisma = require("../config/prisma");
      const purchaseRecord = await prisma.orderItem.findFirst({
        where: {
          productId: prodId,
          order: {
            userId: userId,
            status: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] },
          },
        },
      });
      isVerifiedPurchase = Boolean(purchaseRecord);
    } catch (dbErr) {
      console.warn('[ReviewService] Purchaser check note:', dbErr.message);
    }

    if (process.env.STRICT_VERIFIED_REVIEWS === 'true' && !isVerifiedPurchase) {
      throw createError.Forbidden("Only verified purchasers of this product can submit a review.");
    }

    const review = new Review({
      user: userId,
      product: prodId,
      rating: reqBody.rating,
      reviewText: reqBody.reviewText,
    });
    const savedReview = await review.save();

    return {
      ...savedReview.toObject(),
      isVerifiedPurchase,
      user: {
        id: userId,
        _id: userId,
        fullName: user.name || user.fullName || 'Customer',
        name: user.name || user.fullName || 'Customer',
      },
    };
  }

  async getReviewsByProductId(productId) {
    const reviews = await Review.find({ product: String(productId) }).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const obj = r.toObject();
        try {
          const u = await UserService.findUserById(obj.user);
          obj.user = u ? { id: u.id, _id: u.id, fullName: u.name, name: u.name } : { fullName: 'Customer' };
        } catch (e) {
          obj.user = { fullName: 'Customer' };
        }
        return obj;
      })
    );

    return enriched;
  }

  async updateReview(reviewId, reviewText, rating, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw createError.NotFound("Review not found");

    if (String(review.user) !== String(userId)) {
      throw createError.Unauthorized("You are not authorized to update this review");
    }

    review.reviewText = reviewText;
    review.rating = rating;
    await review.save();
    return review;
  }

  async deleteReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw createError.NotFound("Review not found");

    if (String(review.user) !== String(userId)) {
      throw createError.Unauthorized("You are not authorized to delete this review");
    }

    await review.deleteOne();
  }
}

module.exports = new ReviewService();
