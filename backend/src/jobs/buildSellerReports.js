const prisma = require('../config/prisma');
const SellerReport = require('../models/SelllerReposrt');

async function buildSellerReports() {
  console.log('[Job: buildSellerReports] Starting seller report aggregation job...');

  try {
    const sellers = await prisma.seller.findMany();
    let updatedCount = 0;

    for (const seller of sellers) {
      const orderItems = await prisma.orderItem.findMany({
        where: { sellerId: seller.id },
        include: { order: true },
      });

      const totalOrders = new Set(orderItems.map(i => i.orderId)).size;
      const totalSales = orderItems.length;
      const totalEarnings = orderItems.reduce((sum, i) => sum + Number(i.subtotal), 0);

      const canceledItems = orderItems.filter(i => i.order?.status === 'CANCELLED');
      const canceledOrders = new Set(canceledItems.map(i => i.orderId)).size;
      const totalRefunds = canceledItems.reduce((sum, i) => sum + Number(i.subtotal), 0);

      await SellerReport.findOneAndUpdate(
        { seller: seller.id },
        {
          seller: seller.id,
          totalOrders,
          totalSales,
          totalEarnings,
          canceledOrders,
          totalRefunds,
          totalTransactions: totalOrders,
        },
        { upsert: true, new: true }
      );

      updatedCount++;
    }

    console.log(`[Job: buildSellerReports] Successfully synced reports for ${updatedCount} seller(s).`);
  } catch (err) {
    console.error('[Job: buildSellerReports] Error running job:', err.message);
  }
}

module.exports = buildSellerReports;
