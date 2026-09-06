const NotificationService = require('../services/NotificationService');

class NotificationController {
    async getNotifications(req, res) {
        try {
            const user = req.user;
            const seller = req.seller;
            const email = (user?.email || seller?.email || '').toLowerCase().trim();
            const id = user?._id || seller?._id || email;
            const role = user ? 'ROLE_CUSTOMER' : (seller ? 'ROLE_SELLER' : null);

            if (!email && !id) {
                return res.status(401).json({ message: "Authentication required" });
            }

            const notifications = await NotificationService.getNotifications(email || id, role);
            return res.status(200).json(notifications);
        } catch (error) {
            console.error('[NotificationController] getNotifications error:', error.message);
            return res.status(500).json({ message: error.message });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const user = req.user;
            const seller = req.seller;
            const email = (user?.email || seller?.email || '').toLowerCase().trim();
            const id = user?._id || seller?._id || email;
            const role = user ? 'ROLE_CUSTOMER' : (seller ? 'ROLE_SELLER' : null);

            if (!email && !id) {
                return res.status(200).json({ unreadCount: 0 });
            }

            const count = await NotificationService.getUnreadCount(email || id, role);
            return res.status(200).json({ unreadCount: count });
        } catch (error) {
            console.error('[NotificationController] getUnreadCount error:', error.message);
            return res.status(500).json({ message: error.message });
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const seller = req.seller;
            const email = (user?.email || seller?.email || '').toLowerCase().trim();
            const entityId = user?._id || seller?._id || email;

            const updated = await NotificationService.markAsRead(id, email || entityId);
            return res.status(200).json(updated || { message: "Updated" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const user = req.user;
            const seller = req.seller;
            const email = (user?.email || seller?.email || '').toLowerCase().trim();
            const entityId = user?._id || seller?._id || email;
            const role = user ? 'ROLE_CUSTOMER' : (seller ? 'ROLE_SELLER' : null);

            const result = await NotificationService.markAllAsRead(email || entityId, role);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const seller = req.seller;
            const email = (user?.email || seller?.email || '').toLowerCase().trim();
            const entityId = user?._id || seller?._id || email;

            const result = await NotificationService.deleteNotification(id, email || entityId);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new NotificationController();
