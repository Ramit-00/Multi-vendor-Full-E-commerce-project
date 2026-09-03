const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController.js'); 

router.get('/', dealController.getAllDeals);

router.post('/', dealController.createDeals);

router.patch('/:id', dealController.updateDeal);

router.delete('/:id', dealController.deleteDeals);

module.exports = router; 
