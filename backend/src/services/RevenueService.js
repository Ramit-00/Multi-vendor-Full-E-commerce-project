const prisma = require("../config/prisma");

class RevenueService {
  getStartOfDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  getEndOfDay(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  async getDailyRevenueForChart(days, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);

      const startOfDay = this.getStartOfDay(date);
      const endOfDay = this.getEndOfDay(date);

      try {
        const items = await prisma.orderItem.findMany({
          where: {
            sellerId: String(sellerId),
            order: {
              createdAt: { gte: startOfDay, lte: endOfDay },
              status: { not: 'CANCELLED' },
            },
          },
          select: { subtotal: true },
        });

        const dailyRevenue = items.reduce((total, it) => total + Number(it.subtotal), 0);

        revenueData.push({
          revenue: dailyRevenue,
          date: this.formatDate(date),
        });
      } catch (e) {
        revenueData.push({
          revenue: 0,
          date: this.formatDate(date),
        });
      }
    }

    return revenueData;
  }

  async getMonthlyRevenueForChart(months, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      try {
        const items = await prisma.orderItem.findMany({
          where: {
            sellerId: String(sellerId),
            order: {
              createdAt: { gte: startOfMonth, lte: endOfMonth },
              status: { not: 'CANCELLED' },
            },
          },
          select: { subtotal: true },
        });

        const monthlyRevenue = items.reduce((total, it) => total + Number(it.subtotal), 0);

        revenueData.push({
          revenue: monthlyRevenue,
          date: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
        });
      } catch (e) {
        revenueData.push({
          revenue: 0,
          date: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
        });
      }
    }

    return revenueData;
  }

  async getYearlyRevenueForChart(years, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = years - 1; i >= 0; i--) {
      const date = new Date();
      date.setFullYear(currentDate.getFullYear() - i);

      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

      try {
        const items = await prisma.orderItem.findMany({
          where: {
            sellerId: String(sellerId),
            order: {
              createdAt: { gte: startOfYear, lte: endOfYear },
              status: { not: 'CANCELLED' },
            },
          },
          select: { subtotal: true },
        });

        const yearlyRevenue = items.reduce((total, it) => total + Number(it.subtotal), 0);

        revenueData.push({
          revenue: yearlyRevenue,
          date: String(startOfYear.getFullYear()),
        });
      } catch (e) {
        revenueData.push({
          revenue: 0,
          date: String(startOfYear.getFullYear()),
        });
      }
    }

    return revenueData;
  }

  async getHourlyRevenueForChart(sellerId) {
    const revenueData = [];
    const currentDate = new Date();
    const startOfDay = this.getStartOfDay(currentDate);

    for (let i = 0; i < 24; i++) {
      const startOfHour = new Date(startOfDay);
      startOfHour.setHours(i, 0, 0, 0);

      const endOfHour = new Date(startOfDay);
      endOfHour.setHours(i, 59, 59, 999);

      try {
        const items = await prisma.orderItem.findMany({
          where: {
            sellerId: String(sellerId),
            order: {
              createdAt: { gte: startOfHour, lte: endOfHour },
              status: { not: 'CANCELLED' },
            },
          },
          select: { subtotal: true },
        });

        const hourlyRevenue = items.reduce((total, it) => total + Number(it.subtotal), 0);

        revenueData.push({
          revenue: hourlyRevenue,
          date: `${String(i).padStart(2, '0')}:00`,
        });
      } catch (e) {
        revenueData.push({
          revenue: 0,
          date: `${String(i).padStart(2, '0')}:00`,
        });
      }
    }

    return revenueData;
  }
}

module.exports = new RevenueService();
