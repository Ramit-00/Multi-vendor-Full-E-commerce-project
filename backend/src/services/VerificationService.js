const VerificationCode = require('../models/VerificationCode'); 
const mongoose = require('mongoose');

class VerificationService {
    constructor() {
        this.fallbackStore = new Map();
    }

    async createVerificationCode(otp, email) {
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                await VerificationCode.deleteMany({ email: normalized });
                const verificationCode = new VerificationCode({
                    otp,
                    email: normalized,
                });
                return await verificationCode.save();
            } catch (err) {
                console.warn("DB VerificationCode save failed, using fallback:", err.message);
                this.fallbackStore.set(normalized, { otp, email: normalized, createdAt: Date.now() });
                return { otp, email: normalized };
            }
        } else {
            this.fallbackStore.set(normalized, { otp, email: normalized, createdAt: Date.now() });
            return { otp, email: normalized };
        }
    }

    async getVerificationCode(email) {
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                return await VerificationCode.findOne({ email: normalized });
            } catch (err) {
                return this.fallbackStore.get(normalized) || null;
            }
        } else {
            return this.fallbackStore.get(normalized) || null;
        }
    }

    async deleteVerificationCode(email) {
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            try {
                await VerificationCode.deleteMany({ email: normalized });
            } catch (e) {}
        }
        this.fallbackStore.delete(normalized);
    }
}

module.exports = new VerificationService();
