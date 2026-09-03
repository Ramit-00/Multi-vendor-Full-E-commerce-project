const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');


// Admin routes
router.patch('/seller/:id/status/:status', sellerController.updateSellerAccountStatus);

module.exports = router;
