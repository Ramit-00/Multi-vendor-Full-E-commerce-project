const Seller = require("../models/Seller.js");
const jwtProvider = require("../utils/jwtProvider.js");

const sellerAuthMiddleware = async (req, res, next) => {
  try {
    // Check if the Authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or invalid" });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "JWT Token is missing" });
    }

    let payload;
    try {
      payload = jwtProvider.getPayloadFromJwt(token);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const email = payload.email;
    if (!email) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Explicit rejection of customer tokens trying to access seller routes
    if (payload.type === 'CUSTOMER' || payload.role === 'ROLE_CUSTOMER') {
      return res.status(403).json({ message: "Access denied: Seller authentication token required" });
    }

    const mongoose = require('mongoose');
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    if (!dbConnected && process.env.ALLOW_OFFLINE === 'true') {
      req.seller = { email, _id: `offline_${email}`, role: 'ROLE_SELLER' };
      return next();
    }

    // Find the seller using the extracted email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "Seller not found with email " + email });
    }

    req.seller = seller;

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = sellerAuthMiddleware;
