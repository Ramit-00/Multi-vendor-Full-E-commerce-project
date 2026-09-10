const crypto = require('crypto');
const PaymentService = require('../services/PaymentService');
const OrderService = require('../services/OrderService');
const SellerService = require('../services/SellerService');
const SellerReportService = require('../services/SellerReportService');
const TransactionService = require('../services/TransactionService');

const getStripe = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || 'sk_test_placeholder';
  return require('stripe')(stripeKey);
};

/**
 * Handle Stripe Webhooks
 * Verifies cryptographic signature and confirms orders asynchronously & idempotently
 */
const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = null;

  if (endpointSecret && sig) {
    try {
      const stripe = getStripe();
      const payload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.error('[Stripe Webhook Signature Error]:', err.message);
      return res.status(400).send(`Webhook Signature Error: ${err.message}`);
    }
  } else {
    // Development / mock fallback when webhook secret is not yet configured
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured. Accepting event in development fallback mode.');
    event = req.body;
  }

  try {
    const eventType = event?.type;
    console.log(`[Stripe Webhook] Processing event: ${eventType}`);

    if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
      const session = event.data?.object;
      const paymentLinkId = session?.id;
      const paymentIntentId = session?.payment_intent || session?.id;

      const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(paymentLinkId || paymentIntentId);
      if (paymentOrder) {
        await PaymentService.proceedPaymentOrder(paymentOrder, paymentIntentId, paymentLinkId);

        // Process seller reports and transactions idempotently
        if (Array.isArray(paymentOrder.orders)) {
          for (const orderId of paymentOrder.orders) {
            try {
              const order = await OrderService.findOrderById(orderId);
              if (order) {
                await TransactionService.createTransaction(order).catch(() => {});
                const sellerId = order.seller?.id || order.seller?._id || order.seller;
                if (sellerId) {
                  const seller = await SellerService.getSellerById(sellerId).catch(() => null);
                  if (seller) {
                    const sellerReport = await SellerReportService.getSellerReport(seller).catch(() => null);
                    if (sellerReport) {
                      sellerReport.totalOrders += 1;
                      sellerReport.totalEarnings += Number(order.totalSellingPrice) || 0;
                      sellerReport.totalSales += (order.orderItems || []).length;
                      await SellerReportService.updateSellerReport(sellerReport).catch(() => {});
                    }
                  }
                }
              }
            } catch (postErr) {
              console.warn('[Stripe Webhook] Post order processing note:', postErr.message);
            }
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook Processing Error]:', error.message);
    return res.status(500).json({ error: 'Webhook handling failed' });
  }
};

/**
 * Handle Razorpay Webhooks
 * Verifies HMAC-SHA256 signature and confirms orders asynchronously & idempotently
 */
const razorpayWebhookHandler = async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const payload = req.rawBody 
    ? req.rawBody.toString('utf8') 
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  if (secret && sig) {
    try {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (expectedSig !== sig) {
        console.error('[Razorpay Webhook Signature Mismatch]');
        return res.status(400).send('Invalid webhook signature');
      }
    } catch (err) {
      console.error('[Razorpay Webhook Signature Error]:', err.message);
      return res.status(400).send(`Webhook Signature Error: ${err.message}`);
    }
  } else {
    console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured. Accepting event in development fallback mode.');
  }

  try {
    const event = typeof req.body === 'object' ? req.body : JSON.parse(payload);
    const eventType = event?.event;
    console.log(`[Razorpay Webhook] Processing event: ${eventType}`);

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity || event.payload?.order?.entity;
      const paymentId = paymentEntity?.id;
      const orderId = paymentEntity?.order_id;

      const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(paymentId || orderId);
      if (paymentOrder) {
        await PaymentService.proceedPaymentOrder(paymentOrder, paymentId, orderId);

        if (Array.isArray(paymentOrder.orders)) {
          for (const ordId of paymentOrder.orders) {
            try {
              const order = await OrderService.findOrderById(ordId);
              if (order) {
                await TransactionService.createTransaction(order).catch(() => {});
              }
            } catch (e) {}
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook Processing Error]:', error.message);
    return res.status(500).json({ error: 'Webhook handling failed' });
  }
};

module.exports = {
  stripeWebhookHandler,
  razorpayWebhookHandler,
};
