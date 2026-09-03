const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();



// Search for products by query
router.get('/search',  productController.searchProduct);

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:productId', productController.getProductById);

module.exports = router;
