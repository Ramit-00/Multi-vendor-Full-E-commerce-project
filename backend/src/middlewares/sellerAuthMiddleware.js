const SellerService = require("../services/SellerService");
const jwtProvider = require("../utils/jwtProvider.js");

const sellerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or invalid" });
    }

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

    if (payload.type === 'CUSTOMER' || payload.role === 'ROLE_CUSTOMER') {
      return res.status(403).json({ message: "Access denied: Seller authentication token required" });
    }

    let seller;
    try {
      seller = await SellerService.getSellerByEmail(email);
    } catch (err) {
      return res.status(404).json({ message: "Seller not found with email " + email });
    }

    if (seller.accountStatus === 'BANNED' || seller.accountStatus === 'CLOSED' || seller.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        message: `Access denied: Your seller account is ${seller.accountStatus.toLowerCase()}. Contact platform support.`
      });
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
