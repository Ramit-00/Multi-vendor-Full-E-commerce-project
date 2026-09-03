const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');

router.get('/profile', sellerAuthMiddleware, sellerController.getSellerProfile);

router.post('/', sellerController.createSeller);

router.get('/', sellerController.getAllSellers);

router.patch('/', sellerAuthMiddleware, sellerController.updateSeller);

router.get('/:id', sellerController.getSellerById);

// OTP routes for seller onboarding & login
router.post('/sent/otp', sellerController.sendSellerOtp);
router.post('/sent/login-otp', sellerController.sendSellerLoginOtp);

// Forgot Password routes for seller
router.post('/forgot-password/sent-otp', sellerController.sendForgotPasswordOtp);
router.post('/forgot-password/reset', sellerController.resetForgotPassword);

router.post('/verify-email-otp', sellerController.verifyEmailOtp);
router.post('/verify/login-otp', sellerController.verifyLoginOtp);
router.post('/verify/otp', sellerController.verifyEmail);

router.delete('/:id', sellerController.deleteSeller);

module.exports = router;
