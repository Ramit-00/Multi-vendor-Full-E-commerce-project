import express from 'express';
import sellerController from '../controller/sellerController.js';
import { sellerAuthMiddleware } from '../middleware/sellerAuthMiddleware.js';

const router = express.Router();

router.get('/profile', sellerAuthMiddleware, sellerController.getSellerProfile);
router.get('/all', sellerController.getAllSellers);
router.post('/create', sellerController.createSeller);
router.patch('/update/:id', sellerController.updateSeller);
router.post('/verify/login-otp', sellerController.verifyLoginOtp);

export default router;