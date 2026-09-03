const mongoose = require('mongoose');
const PaymentStatus = require('../domain/PaymentStatus');
const PaymentMethod = require('../domain/PaymentMethod');
const PaymentOrderStatus = require('../domain/PaymentOrderStatus');

const paymentOrderSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(PaymentOrderStatus),  
        default: PaymentStatus.PENDING 
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.RAZORPAY
    },
    paymentLinkId: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.Mixed,
        required: true  
    },
    orders: [{
        type: mongoose.Schema.Types.Mixed  
    }]
}, {
    timestamps: true  
});

const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
module.exports = PaymentOrder;
