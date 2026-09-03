const OrderService = require("../services/OrderService");
const CartService = require("../services/CartService");
const UserService = require("../services/UserService");
const OrderError = require("../exceptions/OrderError");
const PaymentMethod = require("../domain/PaymentMethod");
const PaymentService = require("../services/PaymentService");
const PaymentOrder = require("../models/PaymentOrder");

class OrderController {
  // Create a new order
  async createOrder(req, res, next) {


    const { shippingAddress } = req.body;
    const {paymentMethod}=req.query;
    const jwt = req.headers.authorization;

    try {
        const user = await req.user;

        const cart = await CartService.findUserCart(user);
        const orders = await OrderService.createOrder(user, shippingAddress, cart);

        const paymentOrder = await PaymentService.createOrder(user, orders);

        const response = {};

        console.log("rresponse ",response,paymentMethod,"--",PaymentMethod.RAZORPAY,"--",paymentMethod === PaymentMethod.RAZORPAY)

        if (paymentMethod === PaymentMethod.RAZORPAY) {
            const payment = await PaymentService.createRazorpayPaymentLink(user, paymentOrder.amount, paymentOrder._id);
            const paymentUrl = payment.short_url;
            const paymentUrlId = payment.id;

            response.payment_link_url = paymentUrl;

            paymentOrder.paymentLinkId = paymentUrlId;
            await PaymentOrder.findByIdAndUpdate(paymentOrder._id,paymentOrder)
            // await this.paymentOrderRepository.save(paymentOrder);
            console.log('payment -- ',payment)

        } else if (paymentMethod === PaymentMethod.STRIPE) {
            const paymentUrl = await PaymentService.createStripePaymentLink(user, paymentOrder.amount, paymentOrder._id);
            response.payment_link_url = paymentUrl;
        }

       

        return res.status(200).json(response);

    } catch (error) {
      console.log("error ",error)
        return res.status(500).json({ message: `Error creating order: ${error.message}` });
    }
  }

  // Get order by ID
  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.findOrderById(orderId);
      return res.status(200).json(order);
    } catch (error) {
        return res.status(401).json({error:error.message});
    }
  }

  async getOrderItemById(req, res, next) {
    try {
      const { orderItemId } = req.params;
      const orderItem = await OrderService.findOrderItemById(orderItemId);
      return res.status(200).json(orderItem);
    } catch (error) {
        return res.status(401).json({error:error.message});
    }
  }

  // Get user's order history
  async getUserOrderHistory(req, res) {
    // console.log("req ",req.user)
    try {
        const userId = await req.user._id;
        const orderHistory = await OrderService.usersOrderHistory(userId);
      return res.status(200).json(orderHistory);
    } catch (error) {
        return res.status(401).json({error:error.message});
    }
  }

  // Get orders for a specific seller (shop)
  async getSellersOrders(req, res) {
    try {
      const sellerId = req.seller._id
      const orders = await OrderService.getShopsOrders(sellerId);
      return res.status(200).json(orders);
    } catch (error) {
       return res.status(401).json({error:error.message});
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { orderId,orderStatus } = req.params;

      const updatedOrder = await OrderService.updateOrderStatus(
        orderId,
        orderStatus
      );
      return res
        .status(200)
        .json(updatedOrder);
    } catch (error) {
       return res.status(401).json({error:error.message});
    }
  }

  // Cancel an order
  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      const canceledOrder = await OrderService.cancelOrder(orderId, userId);
      return res
        .status(200)
        .json({
          message: "Order cancelled successfully",
          order: canceledOrder,
        });
    } catch (error) {
       return res.status(401).json({error:error.message});
    }
  }

  // Delete an order
  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      await OrderService.deleteOrder(orderId);
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
       return res.status(401).json({error:error.message});
    }
  }
}

module.exports = new OrderController();
