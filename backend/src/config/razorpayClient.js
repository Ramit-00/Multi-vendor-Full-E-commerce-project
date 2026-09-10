const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || 'rzp_secret_placeholder';

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpay;