import express from 'express';
import userController from '../controller/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

router.get('/profile',authMiddleware, userController.getUserProfileByJwt);

export default router;