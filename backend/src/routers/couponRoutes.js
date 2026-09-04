// routes/adminCouponRoutes.js
const express = require('express');
const couponController = require('../controllers/couponController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');
const router = express.Router();

// Route to apply or remove coupon
router.post('/apply', userAuthMiddleware, couponController.applyCoupon);

// Admin routes
router.post('/admin/create', adminAuthMiddleware, couponController.createCoupon);
router.delete('/admin/delete/:id', adminAuthMiddleware, couponController.deleteCoupon);
router.get('/admin/all', adminAuthMiddleware, couponController.getAllCoupons);

module.exports = router;
