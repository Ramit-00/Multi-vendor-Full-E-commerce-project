const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
    recipientId: {
        type: String,
        required: true,
        index: true,
    },
    recipientEmail: {
        type: String,
        required: true,
        index: true,
    },
    recipientRole: {
        type: String,
        enum: ['ROLE_CUSTOMER', 'ROLE_SELLER', 'ROLE_ADMIN'],
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['ORDER', 'DELIVERY', 'TRANSACTION', 'PAYOUT', 'ACCOUNT', 'SYSTEM'],
        default: 'SYSTEM',
        index: true,
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    link: {
        type: String,
        default: '',
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    // MongoDB Time-To-Live (TTL) index: automatically deleted after 30 days (2,592,000 seconds)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60, // 30 days
    }
}, {
    timestamps: true,
});

// Compound indices for fast user & seller notification feed retrieval
notificationSchema.index({ recipientEmail: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, recipientEmail: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
