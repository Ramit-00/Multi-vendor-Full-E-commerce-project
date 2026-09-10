const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');

// Create a new order
router.post('/', userAuthMiddleware, orderController.createOrder);

// Specific routes MUST come before generic parameterized routes (/:orderId)
// Get user's order history
router.get('/user', userAuthMiddleware, orderController.getUserOrderHistory);

// Get order item by ID
router.get('/item/:orderItemId', userAuthMiddleware, orderController.getOrderItemById);

// Cancel an order
router.put('/:orderId/cancel', userAuthMiddleware, orderController.cancelOrder);

// Download / view order invoice
router.get('/:orderId/invoice', userAuthMiddleware, orderController.getOrderInvoice);

// Request refund for an order
router.post('/:orderId/refund', userAuthMiddleware, orderController.requestRefund);

// Get order by ID
router.get('/:orderId', userAuthMiddleware, orderController.getOrderById);

// Delete an order
router.delete('/:orderId', userAuthMiddleware, orderController.deleteOrder);

module.exports = router;
