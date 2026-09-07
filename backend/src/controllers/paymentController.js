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

    const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(
      paymentLinkId
    );

    const paymentSuccess = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    if (paymentSuccess) {
      for (let orderId of paymentOrder.orders) {
        const order = await OrderService.findOrderById(orderId);

        // Create transaction for the order
        await TransactionService.createTransaction(order);

        // Get seller and update seller report
        const seller = await SellerService.getSellerById(order.seller?.id || order.seller?._id || order.seller);
        const sellerReport = await SellerReportService.getSellerReport(seller);

        sellerReport.totalOrders += 1;
        sellerReport.totalEarnings += order.totalSellingPrice;
        sellerReport.totalSales += (order.orderItems || []).length;

        await SellerReportService.updateSellerReport(sellerReport);
      }

      await CartService.clearCart(user);

      return res.status(201).json({
        message: "Payment successful",
      });
    } else {
      return res.status(400).json({
        message: "Payment failed",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  paymentSuccessHandler,
};
