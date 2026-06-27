import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

router.post("/send/login-signup-otp", authController.sendLoginOtp);

mosule.exports = router;