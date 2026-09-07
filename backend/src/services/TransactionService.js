const prisma = require('../config/prisma');

class TransactionService {
  async createTransaction(order) {
    try {
      const orderId = String(order?.id || order?._id || order);
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId },
      });

      if (existingPayment) {
        return existingPayment;
      }

      const amount = Number(order?.totalAmount || order?.totalSellingPrice || 0);
      const payment = await prisma.payment.create({
        data: {
          orderId,
          amount,
          paymentGateway: 'PENDING',
          status: 'PENDING',
        },
      });

      return payment;
    } catch (err) {
      console.warn("[TransactionService] createTransaction notice:", err.message);
      return null;
    }
  }

  async getTransactionsBySellerId(sellerId) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          order: {
            orderItems: {
              some: { sellerId: String(sellerId) },
            },
          },
        },
        include: {
          order: {
            include: { user: true, shippingAddress: true, orderItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return payments.map(p => ({
        id: p.id,
        _id: p.id,
        amount: Number(p.amount),
        status: p.status,
        customer: p.order?.user,
        order: p.order,
        createdAt: p.createdAt,
      }));
    } catch (e) {
      console.warn("[TransactionService] getTransactionsBySellerId notice:", e.message);
      return [];
    }
  }

  async getAllTransactions() {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          order: {
            include: { user: true, shippingAddress: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return payments.map(p => ({
        id: p.id,
        _id: p.id,
        amount: Number(p.amount),
        status: p.status,
        customer: p.order?.user,
        order: p.order,
        createdAt: p.createdAt,
      }));
    } catch (e) {
      console.warn("[TransactionService] getAllTransactions notice:", e.message);
      return [];
    }
  }
}

module.exports = new TransactionService();
