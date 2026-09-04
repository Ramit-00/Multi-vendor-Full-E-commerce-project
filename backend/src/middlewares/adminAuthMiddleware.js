const jwtProvider = require("../utils/jwtProvider");
const User = require("../models/User");
const UserRoles = require("../domain/UserRole");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied: Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied: Missing JWT token" });
    }

    let payload;
    try {
      payload = jwtProvider.verifyJwt(token);
    } catch (err) {
      return res.status(401).json({ message: "Access denied: Invalid or expired token" });
    }

    if (!payload || (payload.role !== UserRoles.ADMIN && payload.role !== "ROLE_ADMIN")) {
      return res.status(403).json({ message: "Access denied: Administrator privileges required" });
    }

    const mongoose = require("mongoose");
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    if (!dbConnected && process.env.ALLOW_OFFLINE === "true") {
      req.admin = {
        _id: "offline_admin",
        email: payload.email,
        fullName: "Master Administrator",
        role: "ROLE_ADMIN",
      };
      req.user = req.admin;
      return next();
    }

    const admin = await User.findOne({ email: payload.email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    if (admin.role !== UserRoles.ADMIN && admin.role !== "ROLE_ADMIN") {
      return res.status(403).json({ message: "Access denied: Insufficient privileges" });
    }

    if (admin.status === "BANNED" || admin.status === "SUSPENDED") {
      return res.status(403).json({ message: "Admin account is deactivated or suspended" });
    }

    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    console.error("AdminAuthMiddleware error:", error.message);
    return res.status(500).json({ message: "Internal server error during authorization" });
  }
};

module.exports = adminAuthMiddleware;
