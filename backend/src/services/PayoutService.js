const prisma = require('../config/prisma');

class PayoutService {
  /**
   * Fetch all payouts for a seller, automatically syncing delivered order earnings
   */
  async getPayoutsBySeller(sellerId) {
    try {
      const cleanSellerId = String(sellerId || '');

      // 1. Find delivered order items for this seller that don't yet have a payout record
      const deliveredItems = await prisma.orderItem.findMany({
        where: {
          sellerId: cleanSellerId,
          order: {
            status: { in: ['DELIVERED', 'CONFIRMED'] },
          },
        },
        include: {
          seller: true,
          order: true,
          product: true,
        },
      });

      // 2. Create pending payouts for any delivered items missing them
      for (const item of deliveredItems) {
        const existing = await prisma.sellerPayout.findUnique({
          where: { orderItemId: item.id },
        });

        if (!existing) {
          const commissionRate = item.seller?.commissionRate ? Number(item.seller.commissionRate) : 0.10;
          const grossAmount = Number(item.subtotal || (item.unitPrice * item.quantity));
          const netPayout = Math.max(0, grossAmount * (1 - commissionRate));

          try {
            await prisma.sellerPayout.create({
              data: {
                sellerId: cleanSellerId,
                orderItemId: item.id,
                amount: netPayout,
                status: 'PENDING',
              },
            });
          } catch (e) {
            // Ignore unique constraint race conditions
          }
        }
      }

      // 3. Retrieve all payouts for this seller
      const payouts = await prisma.sellerPayout.findMany({
        where: { sellerId: cleanSellerId },
        include: {
          orderItem: {
            include: {
              product: true,
              order: {
                include: {
                  shippingAddress: true,
                  user: { select: { name: true, email: true, phone: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return payouts.map(p => ({
        id: p.id,
        _id: p.id,
        amount: Number(p.amount),
        status: p.status,
        date: p.createdAt,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        orderId: p.orderItem?.orderId,
        order: p.orderItem?.order,
        orderItems: p.orderItem ? [{
          _id: p.orderItem.id,
          id: p.orderItem.id,
          product: {
            title: p.orderItem.product?.name || 'Product',
            sellingPrice: Number(p.orderItem.unitPrice || 0),
            images: [],
            color: 'Standard',
          },
          size: 'FREE',
        }] : [],
      }));
    } catch (error) {
      console.error('[PayoutService] getPayoutsBySeller error:', error.message);
      return [];
    }
  }

  async getPayoutById(payoutId) {
    const payout = await prisma.sellerPayout.findUnique({
      where: { id: String(payoutId) },
      include: {
        orderItem: {
          include: { product: true, order: true },
        },
      },
    });

    if (!payout) {
      throw new Error('Payout record not found');
    }

    return {
      id: payout.id,
      _id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      date: payout.createdAt,
      paidAt: payout.paidAt,
      orderItem: payout.orderItem,
    };
  }

  async updatePayoutStatus(payoutId, status) {
    const cleanStatus = String(status || '').toUpperCase() === 'PAID' ? 'PAID' : 'PENDING';
    const updated = await prisma.sellerPayout.update({
      where: { id: String(payoutId) },
      data: {
        status: cleanStatus,
        paidAt: cleanStatus === 'PAID' ? new Date() : null,
      },
    });

    return {
      id: updated.id,
      _id: updated.id,
      amount: Number(updated.amount),
      status: updated.status,
      paidAt: updated.paidAt,
    };
  }
}

module.exports = new PayoutService();
