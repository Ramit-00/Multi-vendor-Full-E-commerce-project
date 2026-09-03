const jwt = require("jsonwebtoken");
const UserService = require("../services/UserService");
const jwtProvider = require("../utils/jwtProvider");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "jwt token is missing" });
    }

    // If mongoose is not connected and ALLOW_OFFLINE is true, decode token and attach minimal user
    const mongoose = require('mongoose');
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    if (!dbConnected && process.env.ALLOW_OFFLINE === 'true') {
      try {
        const payload = jwtProvider.verifyJwt(token);
        req.user = { email: payload.email, _id: `offline_${payload.email}`, role: payload.role || 'ROLE_CUSTOMER' };
        return next();
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    const user = await UserService.findUserProfileByJwt(token)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error in authentication middleware: ", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = authMiddleware;
