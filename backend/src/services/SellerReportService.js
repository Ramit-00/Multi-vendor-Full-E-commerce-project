const OrderStatus = require("../domain/OrderStatus");
const SellerReport = require("../models/SelllerReposrt");
const OrderService = require("./OrderService");

class SellerReportService {
  async getSellerReport(seller) {
    try {
      const sellerId = String(seller?.id || seller?._id || seller);
      const orders = await OrderService.getShopsOrders(sellerId);

      const totalEarning = orders.reduce(
        (total, order) => total + (Number(order.totalSellingPrice) || 0),
        0
      );

      const canceledOrders = orders.filter(
        (order) => order.orderStatus === OrderStatus.CANCELLED || order.status === 'CANCELLED'
      );
      const totalRefunds = canceledOrders.reduce(
        (total, order) => total + (Number(order.totalSellingPrice) || 0),
        0
      );

      let sellerReport = await SellerReport.findOne({ seller: sellerId });

      if (sellerReport) {
        sellerReport.totalOrders = orders.length;
        sellerReport.totalEarnings = totalEarning;
        sellerReport.totalSales = orders.length;
        sellerReport.canceledOrders = canceledOrders.length;
        sellerReport.totalRefunds = totalRefunds;
        await sellerReport.save();
      } else {
        sellerReport = new SellerReport({
          seller: sellerId,
          totalOrders: orders.length,
          totalEarnings: totalEarning,
          totalSales: orders.length,
          canceledOrders: canceledOrders.length,
          totalRefunds: totalRefunds,
        });
        await sellerReport.save();
      }

      return sellerReport;
    } catch (err) {
      throw new Error(`Error fetching seller report: ${err.message}`);
    }
  }

  async updateSellerReport(sellerReport) {
    try {
      return await SellerReport.findByIdAndUpdate(
        sellerReport._id || sellerReport.id,
        sellerReport,
        { new: true }
      );
    } catch (err) {
      throw new Error(`Error updating seller report: ${err.message}`);
    }
  }
}

module.exports = new SellerReportService();
