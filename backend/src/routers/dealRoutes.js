const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController.js'); 
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

router.get('/', dealController.getAllDeals);

router.post('/', adminAuthMiddleware, dealController.createDeals);

router.patch('/:id', adminAuthMiddleware, dealController.updateDeal);

router.delete('/:id', adminAuthMiddleware, dealController.deleteDeals);

module.exports = router; 
