const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');

// Get all payouts for authenticated seller
router.get('/seller', sellerAuthMiddleware, payoutController.getPayoutsBySeller);

// Get payout by ID
router.get('/:id', sellerAuthMiddleware, payoutController.getPayoutById);

// Update payout status
router.put('/:id/status', sellerAuthMiddleware, payoutController.updatePayoutStatus);

module.exports = router;
