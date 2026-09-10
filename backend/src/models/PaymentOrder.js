const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentOrderSchema = new Schema({
  paymentOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: String,
    required: true,
    index: true,
  },
  orders: [{
    type: String,
    required: true,
  }],
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: 'PENDING',
    index: true,
  },
  paymentLinkId: {
    type: String,
    index: true,
  },
  paymentGateway: {
    type: String,
    default: 'STRIPE',
  },
  // Auto-expire session records after 48 hours
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 48 * 60 * 60,
  },
}, {
  timestamps: true,
});

const PaymentOrder = mongoose.models.PaymentOrder || mongoose.model('PaymentOrder', paymentOrderSchema);

module.exports = PaymentOrder;
