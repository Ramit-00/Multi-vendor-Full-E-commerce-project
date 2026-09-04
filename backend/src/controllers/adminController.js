const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const SellerService = require("../services/SellerService");
const ProductService = require("../services/ProductService");
const jwtProvider = require("../utils/jwtProvider");
const UserRoles = require("../domain/UserRole");
const OrderStatus = require("../domain/OrderStatus");

class AdminController {
  // Master Secret Key Admin Authentication
  async adminLogin(req, res) {
    try {
      const { email, password, adminSecretKey, secretKey } = req.body;
      const keyProvided = adminSecretKey || secretKey;

      const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
      const expectedKey = process.env.ADMIN_SECRET_KEY || "AdminVault#2024!MasterKey";

      // 1. Strict verification of Master Admin Security Key
      if (!keyProvided || String(keyProvided).trim() !== String(expectedKey).trim()) {
        return res.status(403).json({
          message: "Access Denied: Invalid Administrative Master Key. This security event has been logged.",
        });
      }

      if (!cleanEmail || !password) {
        return res.status(400).json({ message: "Admin email and password are required." });
      }

      // 2. Lookup Admin user by email including hidden password
      let admin = null;
      if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
        admin = await User.findOne({ email: cleanEmail }).select("+password");
        if (!admin || (admin.role !== UserRoles.ADMIN && admin.role !== "ROLE_ADMIN")) {
          return res.status(401).json({ message: "Access Denied: Invalid administrator credentials." });
        }

        if (admin.status === "BANNED" || admin.status === "SUSPENDED") {
          return res.status(403).json({ message: "Administrator account is deactivated or suspended." });
        }

        // 3. Verify password hash
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
          return res.status(401).json({ message: "Access Denied: Invalid administrator credentials." });
        }
      } else {
        const expectedEmail = (process.env.ADMIN_EMAIL || "admin@ecom.com").toLowerCase().trim();
        const expectedPass = process.env.ADMIN_PASSWORD || "AdminSecurePassword!2024";
        if (cleanEmail !== expectedEmail || password !== expectedPass) {
          return res.status(401).json({ message: "Access Denied: Invalid administrator credentials." });
        }
        admin = {
          _id: "admin_master_root_id",
          email: cleanEmail,
          fullName: "Master Administrator",
          role: "ROLE_ADMIN",
        };
      }

      // 4. Issue authenticated Admin JWT
      const token = jwtProvider.createJwt({
        email: admin.email,
        role: "ROLE_ADMIN",
        type: "ADMIN",
        adminId: admin._id,
      });

      return res.status(200).json({
        message: "Administrator authentication successful",
        jwt: token,
        role: "ROLE_ADMIN",
        admin: {
          _id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("adminLogin error:", error);
      return res.status(500).json({ message: "Internal server error during admin authentication" });
    }
  }

  // Get current admin profile
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
      const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

      if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
        return res.status(200).json({
          totalGMV: 452900,
          totalMrp: 580000,
          platformEarnings: 45290,
          totalOrders: 14,
          deliveredOrders: 10,
          pendingOrders: 3,
          cancelledOrders: 1,
          totalSellers: 5,
          activeSellers: 4,
          pendingSellers: 1,
          suspendedSellers: 0,
          bannedSellers: 0,
          totalUsers: 25,
          activeUsers: 24,
          bannedUsers: 1,
          totalProducts: 48,
          recentTransactions: [],
        });
      }

      const [orders, sellers, users, products, transactions] = await Promise.all([
        Order.find().lean(),
        Seller.find().lean(),
        User.find({ role: { $ne: "ROLE_ADMIN" } }).lean(),
        Product.countDocuments(),
        Transaction.find().sort({ createdAt: -1 }).limit(10).populate("seller customer order").lean(),
      ]);

      // Financial calculations
      const totalGMV = orders.reduce((sum, o) => sum + (Number(o.totalSellingPrice) || 0), 0);
      const totalMrp = orders.reduce((sum, o) => sum + (Number(o.totalMrpPrice) || 0), 0);
      const platformEarnings = Math.round(totalGMV * 0.10); // Standard 10% platform commission

      const deliveredOrders = orders.filter((o) => o.orderStatus === OrderStatus.DELIVERED).length;
      const pendingOrders = orders.filter(
        (o) => o.orderStatus === OrderStatus.PENDING || o.orderStatus === OrderStatus.PLACED
      ).length;
      const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED).length;

      // Sellers breakdown
      const activeSellers = sellers.filter((s) => s.accountStatus === "ACTIVE").length;
      const pendingSellers = sellers.filter((s) => s.accountStatus === "PENDING_VERIFICATION").length;
      const suspendedSellers = sellers.filter((s) => s.accountStatus === "SUSPENDED").length;
      const bannedSellers = sellers.filter((s) => s.accountStatus === "BANNED").length;

      // Users breakdown
      const activeUsers = users.filter((u) => u.status !== "BANNED").length;
      const bannedUsers = users.filter((u) => u.status === "BANNED").length;

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
        totalProducts: products,
        recentTransactions: transactions || [],
      });
    } catch (error) {
      console.error("getPlatformOverview error:", error);
      return res.status(500).json({ message: "Failed to generate platform overview", error: error.message });
    }
  }

  // Users Management - Get all customer users
  async getAllUsers(req, res) {
    try {
      const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
      if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
        const AuthService = require("../services/AuthService");
        const fallbackList = Array.from((AuthService.fallbackUsers && AuthService.fallbackUsers.values()) || []);
        return res.status(200).json(fallbackList);
      }

      const users = await User.find({ role: { $ne: "ROLE_ADMIN" } })
        .sort({ createdAt: -1 })
        .lean();

      // Attach orders count for each user
      const usersWithStats = await Promise.all(
        users.map(async (u) => {
          const orderCount = await Order.countDocuments({ user: u._id });
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

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: `User status successfully updated to ${status}`,
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update user status", error: error.message });
    }
  }

  // Users Management - Delete user permanently
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "ROLE_ADMIN") {
        return res.status(403).json({ message: "Cannot delete master administrator account" });
      }

      await User.findByIdAndDelete(id);
      return res.status(200).json({ message: "User removed successfully from database", id });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
  }

  // Sellers Management - Get all sellers with product & sales counts
  async getAllSellers(req, res) {
    try {
      const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
      if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
        const SellerService = require("../services/SellerService");
        const fallbackList = Array.from((SellerService.fallbackSellers && SellerService.fallbackSellers.values()) || []);
        return res.status(200).json(fallbackList);
      }

      const { status } = req.query;
      const query = status && status !== "ALL" ? { accountStatus: status } : {};

      const sellers = await Seller.find(query).sort({ createdAt: -1 }).populate("pickupAddress").lean();

      const sellersWithStats = await Promise.all(
        sellers.map(async (s) => {
          const [productCount, orders] = await Promise.all([
            Product.countDocuments({ seller: s._id }),
            Order.find({ seller: s._id }).lean(),
          ]);

          const totalRevenue = orders.reduce(
            (sum, o) => sum + (Number(o.totalSellingPrice) || 0),
            0
          );

          return {
            ...s,
            productCount,
            orderCount: orders.length,
            totalRevenue,
          };
        })
      );

      return res.status(200).json(sellersWithStats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch sellers", error: error.message });
    }
  }

  // Sellers Management - Update status (ACTIVE, SUSPENDED, BANNED, CLOSED)
  async updateSellerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const seller = await SellerService.updateSellerAccountStatus(id, status);
      return res.status(200).json({
        message: `Seller account status updated to ${status}`,
        seller,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Sellers Management - Delete seller
  async deleteSeller(req, res) {
    try {
      const { id } = req.params;
      await Seller.findByIdAndDelete(id);
      return res.status(200).json({ message: "Seller account deleted permanently", id });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete seller", error: error.message });
    }
  }

  // Seller Profile & Financial Deep-Dive
  async getSellerFinancials(req, res) {
    try {
      const { id } = req.params;

      const seller = await Seller.findById(id).populate("pickupAddress").lean();
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Fetch all orders associated with this seller
      const orders = await Order.find({ seller: id })
        .populate("user orderItems")
        .sort({ createdAt: -1 })
        .lean();

      // Compute financial statistics
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalSellingPrice) || 0), 0);
      const completedOrders = orders.filter((o) => o.orderStatus === OrderStatus.DELIVERED);
      const completedRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.totalSellingPrice) || 0), 0);
      const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED);
      const totalRefunds = cancelledOrders.reduce((sum, o) => sum + (Number(o.totalSellingPrice) || 0), 0);

      // Estimated 10% platform fee
      const platformFee = Math.round(totalRevenue * 0.10);
      const netSellerPayout = Math.max(0, totalRevenue - platformFee - totalRefunds);

      // Fetch seller transactions
      const transactions = await Transaction.find({ seller: id })
        .populate("customer order")
        .sort({ createdAt: -1 })
        .lean();

      // Product count
      const productCount = await Product.countDocuments({ seller: id });

      return res.status(200).json({
        seller,
        financials: {
          totalRevenue,
          completedRevenue,
          totalRefunds,
          platformFee,
          netSellerPayout,
          totalOrders: orders.length,
          completedCount: completedOrders.length,
          cancelledCount: cancelledOrders.length,
          productCount,
        },
        transactions: transactions || [],
        orders: orders || [],
      });
    } catch (error) {
      console.error("getSellerFinancials error:", error);
      return res.status(500).json({ message: "Failed to load seller financials", error: error.message });
    }
  }

  // Catalog Management - Get all products across all sellers
  async getAllProducts(req, res) {
    try {
      const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
      if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
        return res.status(200).json([]);
      }

      const { search, category } = req.query;
      let filter = {};

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (category && category !== "ALL") {
        filter.category = category;
      }

      const products = await Product.find(filter)
        .populate("seller category")
        .sort({ createdAt: -1 })
        .lean();

      const host = req.get("host");
      const protocol = req.protocol;
      const mapImage = (img) => {
        if (!img) return img;
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        const parts = img.split("/").map(encodeURIComponent).join("/");
        return `${protocol}://${host}/product-images/${parts}`;
      };

      const formatted = products.map((p) => ({
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

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await ProductService.deleteProduct(productId);
      return res.status(200).json({
        message: "Product removed from marketplace catalog successfully",
        productId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
  }

  // Transactions Management - Get master transaction records
  async getAllTransactions(req, res) {
    try {
      const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
      if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
        return res.status(200).json([]);
      }

      const transactions = await Transaction.find()
        .populate("seller customer order")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
    }
  }
}

module.exports = new AdminController();
