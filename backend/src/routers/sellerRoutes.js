const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');

router.get('/profile', sellerAuthMiddleware, sellerController.getSellerProfile);

router.post('/', sellerController.createSeller);

router.get('/', sellerController.getAllSellers);

router.patch('/', sellerAuthMiddleware, sellerController.updateSeller);

router.get('/:id', sellerController.getSellerById);

// Google and Password routes for seller
router.post('/google/verify', sellerController.googleVerifySeller);
router.post('/login/password', sellerController.sellerPasswordLogin);

// OTP routes for seller onboarding & login
router.post('/sent/otp', sellerController.sendSellerOtp);
router.post('/sent/login-otp', sellerController.sendSellerLoginOtp);

// Forgot Password routes for seller
router.post('/forgot-password/sent-otp', sellerController.sendForgotPasswordOtp);
router.post('/forgot-password/reset', sellerController.resetForgotPassword);

router.post('/verify-email-otp', sellerController.verifyEmailOtp);
router.post('/verify-google-email', sellerController.verifyGoogleEmail);
router.post('/verify/login-otp', sellerController.verifyLoginOtp);
router.post('/verify/otp', sellerController.verifyEmail);

const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');
router.delete('/:id', adminAuthMiddleware, sellerController.deleteSeller);

module.exports = router;
