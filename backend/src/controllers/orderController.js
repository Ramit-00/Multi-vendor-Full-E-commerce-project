const OrderService = require("../services/OrderService");
const CartService = require("../services/CartService");
const UserService = require("../services/UserService");
const OrderError = require("../exceptions/OrderError");
const PaymentMethod = require("../domain/PaymentMethod");
const PaymentService = require("../services/PaymentService");
const InvoiceService = require("../services/InvoiceService");

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

        if (paymentMethod === PaymentMethod.RAZORPAY) {
            const payment = await PaymentService.createRazorpayPaymentLink(user, paymentOrder.amount, paymentOrder._id);
            const paymentUrl = payment.short_url;
            const paymentUrlId = payment.id;

            response.payment_link_url = paymentUrl;

            await PaymentService.setPaymentLinkId(paymentOrder._id, paymentUrlId);

        } else if (paymentMethod === PaymentMethod.STRIPE) {
            const payment = await PaymentService.createStripePaymentLink(user, paymentOrder.amount, paymentOrder._id);
            response.payment_link_url = payment.url;
            await PaymentService.setPaymentLinkId(paymentOrder._id, payment.id);
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
      const reqUserId = String(req.user?.id || req.user?._id || '');
      const reqRole = req.user?.role;
      const orderUserId = String(order.userId || order.user?.id || order.user?._id || order.user || '');

      if (reqRole !== 'ROLE_ADMIN' && orderUserId && reqUserId && orderUserId !== reqUserId) {
        return res.status(403).json({ error: "Access denied: You are not authorized to view this order" });
      }

      return res.status(200).json(order);
    } catch (error) {
      return res.status(404).json({ error: error.message });
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
      const reqUserId = String(req.user?.id || req.user?._id || '');
      const reqRole = req.user?.role;
      const order = await OrderService.findOrderById(orderId);
      const orderUserId = String(order.userId || order.user?.id || order.user?._id || order.user || '');

      if (reqRole !== 'ROLE_ADMIN' && orderUserId && reqUserId && orderUserId !== reqUserId) {
        return res.status(403).json({ error: "Access denied: You are not authorized to delete this order" });
      }

      await OrderService.deleteOrder(orderId);
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  // Get invoice HTML or JSON data for an order
  async getOrderInvoice(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || req.user?._id;
      const sellerId = req.seller?.id || req.seller?._id;
      const isAdmin = req.user?.role === 'ROLE_ADMIN' || req.user?.role === 'ADMIN';

      const orderData = await InvoiceService.getInvoiceData(
        orderId,
        isAdmin ? null : userId,
        sellerId
      );

      // If requested as raw HTML or browser print view:
      if (req.query.format === 'html' || req.headers.accept?.includes('text/html')) {
        const html = InvoiceService.renderInvoiceHtml(orderData);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      // Default: Return structured invoice payload with render URL
      return res.status(200).json({
        invoiceNumber: `INV-${orderData.id.substring(0, 8).toUpperCase()}`,
        order: orderData,
        viewUrl: `/api/orders/${orderData.id}/invoice?format=html`,
      });
    } catch (error) {
      const isAuthErr = error.message.toLowerCase().includes('unauthorized');
      return res.status(isAuthErr ? 403 : 404).json({ error: error.message });
    }
  }

  // Request a refund for an order
  async requestRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = String(req.user?.id || req.user?._id || '');
      const prisma = require('../config/prisma');

      const order = await prisma.order.findUnique({
        where: { id: String(orderId) },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'ROLE_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized to request refund for this order' });
      }

      const refund = await prisma.refund.create({
        data: {
          orderId: order.id,
          reason: reason || 'Customer requested refund',
          amount: order.totalAmount,
          status: 'REQUESTED',
        },
      });

      return res.status(201).json({
        message: 'Refund request submitted successfully',
        refund,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OrderController();
