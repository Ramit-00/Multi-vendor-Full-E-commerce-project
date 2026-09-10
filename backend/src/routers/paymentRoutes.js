// paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paymentWebhookController = require('../controllers/paymentWebhookController');
const authMiddleware = require('../middlewares/userAuthMiddleware');

// Webhook endpoints for asynchronous payment status confirmation
router.post('/webhook/stripe', paymentWebhookController.stripeWebhookHandler);
router.post('/webhook/razorpay', paymentWebhookController.razorpayWebhookHandler);

// Route for client-side payment success redirect verification
router.get('/:paymentId', authMiddleware, paymentController.paymentSuccessHandler);

module.exports = router;
