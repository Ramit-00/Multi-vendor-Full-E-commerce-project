const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const jwtProvider = require('../utils/jwtProvider');
const UserService = require('../services/UserService');
const SellerService = require('../services/SellerService');

// Unified auth middleware that decodes either Customer or Seller token
const unifiedNotificationAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header is missing' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'jwt token is missing' });
        }

        const payload = jwtProvider.verifyJwt(token);
        const email = (payload.email || '').toLowerCase().trim();
        const role = payload.role || '';

        if (role === 'ROLE_SELLER' || payload.type === 'SELLER') {
            try {
                const seller = await SellerService.getSellerByEmail(email);
                req.seller = seller || { email, role: 'ROLE_SELLER' };
            } catch (e) {
                req.seller = { email, role: 'ROLE_SELLER' };
            }
            return next();
        }

        // Default to Customer
        try {
            const user = await UserService.findUserProfileByJwt(token);
            req.user = user || { email, role: 'ROLE_CUSTOMER' };
        } catch (e) {
            req.user = { email, role: 'ROLE_CUSTOMER' };
        }
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

router.use(unifiedNotificationAuth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
