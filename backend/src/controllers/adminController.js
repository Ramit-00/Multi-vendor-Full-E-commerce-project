const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const SellerService = require("../services/SellerService");
const ProductService = require("../services/ProductService");
const UserService = require("../services/UserService");
const jwtProvider = require("../utils/jwtProvider");
const UserRoles = require("../domain/UserRole");
const OrderStatus = require("../domain/OrderStatus");

let cloudinaryImageMap = {};
try {
  cloudinaryImageMap = require("../config/cloudinaryImageMap.json");
} catch (e) {
  cloudinaryImageMap = {};
}

class AdminController {
  // Master Secret Key Admin Authentication
  async adminLogin(req, res) {
    try {
      const { email, password, adminSecretKey, secretKey } = req.body;
      const keyProvided = adminSecretKey || secretKey;

      const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
      const expectedKey = process.env.ADMIN_SECRET_KEY;
      if (!expectedKey) {
        return res.status(500).json({ message: "Server configuration error: ADMIN_SECRET_KEY is not configured." });
      }

      if (keyProvided !== expectedKey) {
        return res.status(401).json({ message: "Access Denied: Invalid Master Secret Key." });
      }

      if (!cleanEmail || !password) {
        return res.status(400).json({ message: "Admin email and password are required." });
      }

      // 2. Lookup Admin user in PostgreSQL
      let admin = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!admin || admin.role !== 'ADMIN') {
        // Fallback offline credentials check
        const expectedEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
        const expectedPass = process.env.ADMIN_PASSWORD || null;
        if (expectedEmail && expectedPass && cleanEmail === expectedEmail && password === expectedPass) {
          admin = {
            id: "admin_master_root_id",
            email: cleanEmail,
            name: "Master Administrator",
            role: "ADMIN",
          };
        } else {
          return res.status(401).json({ message: "Access Denied: Invalid administrator credentials." });
        }
      } else {
        const isPasswordMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isPasswordMatch) {
          return res.status(401).json({ message: "Access Denied: Invalid administrator credentials." });
        }
      }

      // 4. Issue authenticated Admin JWT
      const token = jwtProvider.createJwt({
        email: admin.email,
        role: "ROLE_ADMIN",
        type: "ADMIN",
        adminId: admin.id,
      });

      return res.status(200).json({
        message: "Administrator authentication successful",
        jwt: token,
        role: "ROLE_ADMIN",
        admin: {
          _id: admin.id,
          id: admin.id,
          email: admin.email,
          fullName: admin.name || "Master Administrator",
          role: "ROLE_ADMIN",
        },
      });
    } catch (error) {
      console.error("adminLogin error:", error);
      return res.status(500).json({ message: "Internal server error during admin authentication" });
    }
  }

  async getAdminProfile(req, res) {
    try {
      const admin = req.admin || req.user;
      return res.status(200).json(admin);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Financial & Platform Health Overview
  async getPlatformOverview(req, res) {
    try {
      const [orders, sellers, users, productsCount] = await Promise.all([
        prisma.order.findMany({
          include: { payment: true, orderItems: true },
        }),
        prisma.seller.findMany({
          include: { user: true },
        }),
        prisma.user.findMany({
          where: { role: { not: 'ADMIN' } },
        }),
        prisma.product.count(),
      ]);

      const totalGMV = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const totalMrp = totalGMV;
      const platformEarnings = Math.round(totalGMV * 0.10);

      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
      const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
      const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

      const activeSellers = sellers.filter((s) => s.verificationStatus === 'active' || s.verificationStatus === 'verified').length;
      const pendingSellers = sellers.filter((s) => s.verificationStatus === 'pending').length;
      const suspendedSellers = sellers.filter((s) => s.verificationStatus === 'suspended').length;
      const bannedSellers = sellers.filter((s) => s.verificationStatus === 'banned').length;

      const activeUsers = users.length;
      const bannedUsers = 0;

      const payments = await prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { order: { include: { user: true } } },
      });

      const recentTransactions = payments.map(p => ({
        id: p.id,
        _id: p.id,
        amount: Number(p.amount),
        status: p.status,
        provider: p.paymentGateway,
        order: p.order,
        customer: p.order?.user,
        createdAt: p.createdAt,
      }));

      return res.status(200).json({
        totalGMV,
        totalMrp,
        platformEarnings,
        totalOrders: orders.length,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,
        totalSellers: sellers.length,
        activeSellers,
        pendingSellers,
        suspendedSellers,
        bannedSellers,
        totalUsers: users.length,
        activeUsers,
        bannedUsers,
        totalProducts: productsCount,
        recentTransactions,
      });
    } catch (error) {
      console.error("getPlatformOverview error:", error);
      return res.status(500).json({ message: "Failed to generate platform overview", error: error.message });
    }
  }

  // Users Management - Get all customer users
  async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      const usersWithStats = await Promise.all(
        users.map(async (u) => {
          const orderCount = await prisma.order.count({ where: { userId: u.id } });
          return {
            ...u,
            orderCount,
          };
        })
      );
      return res.status(200).json(usersWithStats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
  }

  // Users Management - Ban or activate user
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["ACTIVE", "BANNED", "SUSPENDED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: { status },
      });

      return res.status(200).json({
        message: `User status successfully updated to ${status}`,
        user: { ...updatedUser, status },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update user status", error: error.message });
    }
  }

  // Users Management - Delete user permanently
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "ADMIN") {
        return res.status(403).json({ message: "Cannot delete master administrator account" });
      }

      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: "User removed successfully from database", id });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
  }

  // Sellers Management - Get all sellers with product & sales counts
  async getAllSellers(req, res) {
    try {
      const { status } = req.query;
      const sellers = await SellerService.getAllSellers(status && status !== 'ALL' ? status : null);

      const sellersWithStats = await Promise.all(
        sellers.map(async (s) => {
          const [productCount, ordersCount, revenueAgg] = await Promise.all([
            prisma.product.count({ where: { sellerId: s.id } }),
            prisma.orderItem.count({ where: { sellerId: s.id } }),
            prisma.orderItem.aggregate({
              where: { sellerId: s.id },
              _sum: { subtotal: true },
            }),
          ]);

          const totalRevenue = Number(revenueAgg._sum.subtotal || 0);

          return {
            ...s,
            productCount,
            orderCount: ordersCount,
            totalRevenue,
          };
        })
      );

      return res.status(200).json(sellersWithStats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch sellers", error: error.message });
    }
  }

  async updateSellerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const seller = await SellerService.updateSellerAccountStatus(id, status);

      // Cascade status to all seller products
      const normalizedStatus = (status || '').toUpperCase();
      if (['SUSPENDED', 'BANNED', 'DEACTIVATED'].includes(normalizedStatus)) {
        await prisma.product.updateMany({
          where: { sellerId: String(id) },
          data: { status: 'INACTIVE' },
        });
      } else if (normalizedStatus === 'ACTIVE') {
        await prisma.product.updateMany({
          where: { sellerId: String(id), status: 'INACTIVE' },
          data: { status: 'ACTIVE' },
        });
      }

      return res.status(200).json({
        message: `Seller account status updated to ${status}`,
        seller,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteSeller(req, res) {
    try {
      const { id } = req.params;
      await SellerService.deleteSeller(id);
      return res.status(200).json({ message: "Seller account deleted permanently", id });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete seller", error: error.message });
    }
  }

  // Seller Profile & Financial Deep-Dive
  async getSellerFinancials(req, res) {
    try {
      const { id } = req.params;
      const seller = await SellerService.getSellerById(id);

      const orderItems = await prisma.orderItem.findMany({
        where: { sellerId: id },
        include: {
          order: { include: { user: true, payment: true } },
          product: true,
        },
        orderBy: { order: { createdAt: 'desc' } },
      });

      const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
      const completedRevenue = orderItems
        .filter(item => item.order?.status === 'DELIVERED')
        .reduce((sum, item) => sum + Number(item.subtotal), 0);
      const totalRefunds = orderItems
        .filter(item => item.order?.status === 'CANCELLED')
        .reduce((sum, item) => sum + Number(item.subtotal), 0);

      const platformFee = Math.round(totalRevenue * Number(seller.commissionRate || 0.10));
      const netSellerPayout = Math.max(0, totalRevenue - platformFee - totalRefunds);

      const productCount = await prisma.product.count({ where: { sellerId: id } });

      return res.status(200).json({
        seller,
        financials: {
          totalRevenue,
          completedRevenue,
          totalRefunds,
          platformFee,
          netSellerPayout,
          totalOrders: orderItems.length,
          completedCount: orderItems.filter(i => i.order?.status === 'DELIVERED').length,
          cancelledCount: orderItems.filter(i => i.order?.status === 'CANCELLED').length,
          productCount,
        },
        transactions: [],
        orders: orderItems.map(i => i.order),
      });
    } catch (error) {
      console.error("getSellerFinancials error:", error);
      return res.status(500).json({ message: "Failed to load seller financials", error: error.message });
    }
  }

  // Catalog Management - Get all products
  async getAllProducts(req, res) {
    try {
      const result = await ProductService.getAllProducts(req.query);
      const mapImage = (img) => {
        if (!img || typeof img !== "string") return img;
        if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) return img;
        if (cloudinaryImageMap[img]) return cloudinaryImageMap[img];
        if (cloudinaryImageMap[img.toLowerCase()]) return cloudinaryImageMap[img.toLowerCase()];
        const basename = img.split(/[/\\]/).pop();
        if (cloudinaryImageMap[basename]) return cloudinaryImageMap[basename];
        if (cloudinaryImageMap[basename.toLowerCase()]) return cloudinaryImageMap[basename.toLowerCase()];
        return img;
      };

      const formatted = (result.content || []).map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images.map(mapImage) : [],
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
  }

  // Catalog Management - Admin Delete any product
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      await ProductService.deleteProduct(productId);
      return res.status(200).json({
        message: "Product removed from marketplace catalog successfully",
        productId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
  }

  // Transactions Management
  async getAllTransactions(req, res) {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { order: { include: { user: true } } },
      });

      const transactions = payments.map(p => ({
        id: p.id,
        _id: p.id,
        amount: Number(p.amount),
        status: p.status,
        provider: p.paymentGateway,
        order: p.order,
        customer: p.order?.user,
        createdAt: p.createdAt,
      }));

      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
    }
  }
}

module.exports = new AdminController();
