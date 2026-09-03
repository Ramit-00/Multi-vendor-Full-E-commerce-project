const Transaction = require('../models/Transaction');
const Seller = require('../models/Seller');
const Order = require('../models/Order');

class TransactionService {
    // Create a new transaction from an order
    async createTransaction(orderId) {
        try {
            const order = await Order.findById(orderId);
            if (!order) return null;

            let sellerId = order.seller;
            if (sellerId && typeof sellerId === 'object') {
                sellerId = sellerId._id || sellerId.id || 'default_seller';
            }

            const transaction = new Transaction({
                seller: sellerId || 'default_seller',
                customer: order.user, 
                order: order._id,
            });

            return await transaction.save();
        } catch (err) {
            console.warn("createTransaction notice:", err.message);
            return null;
        }
    }

    // Get transactions by seller ID
    async getTransactionsBySellerId(sellerId) {
        return await Transaction.find({ seller: sellerId }).populate('order customer');
    }

    // Get all transactions
    async getAllTransactions() {
        return await Transaction.find().populate('seller order customer');
    }
}

module.exports = new TransactionService();
