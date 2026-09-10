const PaymentService = require("../services/PaymentService");
const SellerService = require("../services/SellerService");
const OrderService = require("../services/OrderService");
const SellerReportService = require("../services/SellerReportService");
const TransactionService = require("../services/TransactionService");
const CartService = require("../services/CartService");

const paymentSuccessHandler = async (req, res) => {
  const { paymentId } = req.params;
  const { paymentLinkId } = req.query;

  try {
    const user = await req.user;

    const lookupKey = paymentLinkId || paymentId;
    const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(lookupKey);

    const paymentSuccess = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    if (paymentSuccess) {
      const confirmedOrders = [];
      if (paymentOrder && Array.isArray(paymentOrder.orders)) {
        for (let orderId of paymentOrder.orders) {
          try {
            const order = await OrderService.findOrderById(orderId);
            confirmedOrders.push(order);

            // Create transaction for the order
            await TransactionService.createTransaction(order).catch(() => {});

            // Get seller and update seller report
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
          } catch (orderErr) {
            console.warn('[PaymentController] Post-payment order processing note:', orderErr.message);
          }
        }
      }

      await CartService.clearCart(user).catch(() => {});

      return res.status(200).json({
        message: "Payment verified and order confirmed successfully!",
        orderId: paymentOrder?.orders?.[0] || null,
        orders: paymentOrder?.orders || [],
      });
    } else {
      return res.status(400).json({
        message: "Payment verification failed or payment was not captured.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: `Payment processing error: ${err.message}`,
    });
  }
};

module.exports = {
  paymentSuccessHandler,
};
