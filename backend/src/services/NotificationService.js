const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('../utils/sendEmail');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const NOTIF_CACHE_FILE = path.join(__dirname, '..', '..', '.offline_notifications.json');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class NotificationService {
    constructor() {
        this.fallbackNotifications = [];
        this._loadFallbackCache();
    }

    _loadFallbackCache() {
        try {
            if (fs.existsSync(NOTIF_CACHE_FILE)) {
                const raw = fs.readFileSync(NOTIF_CACHE_FILE, 'utf8');
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    const cutoff = Date.now() - THIRTY_DAYS_MS;
                    this.fallbackNotifications = list.filter(n => new Date(n.createdAt).getTime() >= cutoff);
                }
            }
        } catch (e) {
            console.warn('[NotificationService] Fallback cache load note:', e.message);
        }
    }

    _saveFallbackCache() {
        try {
            const cutoff = Date.now() - THIRTY_DAYS_MS;
            this.fallbackNotifications = this.fallbackNotifications.filter(n => new Date(n.createdAt).getTime() >= cutoff);
            fs.writeFileSync(NOTIF_CACHE_FILE, JSON.stringify(this.fallbackNotifications, null, 2), 'utf8');
        } catch (e) {
            console.warn('[NotificationService] Fallback cache save note:', e.message);
        }
    }

    /**
     * Dispatches in-app notification and synchronized email notification
     */
    async createNotification({ recipientId, recipientEmail, recipientRole = 'ROLE_CUSTOMER', title, message, type = 'SYSTEM', link = '', metadata = {} }) {
        if (!recipientEmail) {
            console.warn('[NotificationService] Notification skipped: missing recipient email');
            return null;
        }

        const normalizedEmail = recipientEmail.toLowerCase().trim();
        const safeRecipientId = String(recipientId || normalizedEmail);
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        let createdNotif = null;

        if (dbConnected) {
            try {
                createdNotif = await Notification.create({
                    recipientId: safeRecipientId,
                    recipientEmail: normalizedEmail,
                    recipientRole,
                    title,
                    message,
                    type,
                    link,
                    metadata,
                    createdAt: new Date(),
                });
            } catch (dbErr) {
                console.warn('[NotificationService] DB save error, using fallback:', dbErr.message);
            }
        }

        if (!createdNotif) {
            createdNotif = {
                _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                recipientId: safeRecipientId,
                recipientEmail: normalizedEmail,
                recipientRole,
                title,
                message,
                type,
                read: false,
                link,
                metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.fallbackNotifications.unshift(createdNotif);
            this._saveFallbackCache();
        }

        // Synchronously or non-blockingly dispatch branded email to recipient
        try {
            sendNotificationEmail(normalizedEmail, title, message, {
                type,
                link,
                role: recipientRole,
                metadata,
            }).catch(mailErr => {
                console.warn('[NotificationService] Background email notice:', mailErr && mailErr.message);
            });
        } catch (mailTriggerErr) {
            console.warn('[NotificationService] Email trigger note:', mailTriggerErr.message);
        }

        return createdNotif;
    }

    /**
     * Get notifications for a user or seller (auto-filters items >30 days)
     */
    async getNotifications(identifier, role) {
        const normalized = (identifier || '').toLowerCase().trim();
        const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                const query = {
                    $or: [
                        { recipientEmail: normalized },
                        { recipientId: identifier }
                    ],
                    createdAt: { $gte: cutoff }
                };
                if (role) {
                    query.recipientRole = role;
                }
                const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
                return notifs;
            } catch (dbErr) {
                console.warn('[NotificationService] DB get error, checking fallback:', dbErr.message);
            }
        }

        // Fallback filter
        return this.fallbackNotifications.filter(n => {
            const matchesId = (n.recipientEmail === normalized || n.recipientId === identifier);
            const matchesRole = !role || n.recipientRole === role;
            const notExpired = new Date(n.createdAt) >= cutoff;
            return matchesId && matchesRole && notExpired;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(identifier, role) {
        const notifs = await this.getNotifications(identifier, role);
        return notifs.filter(n => !n.read).length;
    }

    /**
     * Mark single notification as read
     */
    async markAsRead(notificationId, identifier) {
        const normalized = (identifier || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected && mongoose.Types.ObjectId.isValid(notificationId)) {
            try {
                const updated = await Notification.findOneAndUpdate(
                    {
                        _id: notificationId,
                        $or: [{ recipientEmail: normalized }, { recipientId: identifier }]
                    },
                    { $set: { read: true } },
                    { new: true }
                );
                if (updated) return updated;
            } catch (dbErr) {
                console.warn('[NotificationService] markAsRead DB warning:', dbErr.message);
            }
        }

        const fallbackItem = this.fallbackNotifications.find(n => String(n._id) === String(notificationId));
        if (fallbackItem) {
            fallbackItem.read = true;
            this._saveFallbackCache();
            return fallbackItem;
        }

        return null;
    }

    /**
     * Mark all notifications as read for a recipient
     */
    async markAllAsRead(identifier, role) {
        const normalized = (identifier || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                const query = {
                    $or: [{ recipientEmail: normalized }, { recipientId: identifier }],
                    read: false,
                };
                if (role) query.recipientRole = role;
                await Notification.updateMany(query, { $set: { read: true } });
            } catch (dbErr) {
                console.warn('[NotificationService] markAllAsRead DB warning:', dbErr.message);
            }
        }

        this.fallbackNotifications.forEach(n => {
            if (n.recipientEmail === normalized || n.recipientId === identifier) {
                n.read = true;
            }
        });
        this._saveFallbackCache();

        return { success: true };
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, identifier) {
        const normalized = (identifier || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected && mongoose.Types.ObjectId.isValid(notificationId)) {
            try {
                await Notification.findOneAndDelete({
                    _id: notificationId,
                    $or: [{ recipientEmail: normalized }, { recipientId: identifier }]
                });
            } catch (dbErr) {
                console.warn('[NotificationService] delete DB warning:', dbErr.message);
            }
        }

        this.fallbackNotifications = this.fallbackNotifications.filter(n => String(n._id) !== String(notificationId));
        this._saveFallbackCache();

        return { success: true, notificationId };
    }
}

module.exports = new NotificationService();
