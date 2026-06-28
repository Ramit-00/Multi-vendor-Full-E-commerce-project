import express from "express";
import authController from "../controller/authController.js";
const router = express.Router();

router.post("/send/login-signup-otp", authController.sendLoginOtp);

router.post("/signup", authController.createUser);

router.post("/signin", authController.signin);

export default router;