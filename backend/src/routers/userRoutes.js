import express from 'express';
import { register , verify, reverify, login, logout, forgotPassword , verifyOTP, changePassword, allUser , getUserById} from '../controllers/userController.js';
import { isAuthenticated , isAdmin} from '../middleware/isAuthenticated.js';

const router = express.Router()

router.post('/register', register)
router.post('/verify', verify)
router.post('/reverify', reverify)
router.post('/login', login)
router.post('/logout', isAuthenticated, logout)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp/:email', verifyOTP);
router.post('/change-password/:email', changePassword)
router.get('/all-users', isAuthenticated, isAdmin, allUser)
router.get('/get-user/:userId', getUserById)

export default router;