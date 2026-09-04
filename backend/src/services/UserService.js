const User = require('../models/User');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');
const mongoose = require('mongoose');

class UserService {
    async findUserProfileByJwt(jwt) {
        const email = jwtProvider.getEmailFromJwt(jwt);
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            const user = await User.findOne({ email: normalized }).populate("addresses");
            if (!user) {
                throw new UserError(`User does not exist with email ${email}`);
            }
            return user;
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(normalized) : null;
            if (!user) {
                user = {
                    _id: `user_${Date.now()}`,
                    fullName: 'Valued Customer',
                    email: normalized,
                    mobile: '',
                    role: 'ROLE_CUSTOMER',
                    addresses: [],
                };
                if (AuthService.fallbackUsers) {
                    AuthService.fallbackUsers.set(normalized, user);
                }
            }
            return user;
        }
    }

    async findUserByEmail(email) {
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            const user = await User.findOne({ email: normalized });
            if (!user) {
                throw new UserError(`User does not exist with email ${email}`);
            }
            return user;
        } else {
            const AuthService = require('./AuthService');
            return (AuthService.fallbackUsers && AuthService.fallbackUsers.get(normalized)) || null;
        }
    }

    async updateUserProfile(currentUser, updateData) {
        const email = (currentUser?.email || '').toLowerCase().trim();
        const userId = currentUser?._id;
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        const allowedUpdates = {};
        if (typeof updateData.fullName === 'string' && updateData.fullName.trim()) {
            allowedUpdates.fullName = updateData.fullName.trim();
        }
        if (typeof updateData.mobile === 'string') {
            allowedUpdates.mobile = updateData.mobile.trim();
        }

        if (dbConnected) {
            let updatedUser = null;
            if (userId && !String(userId).startsWith('offline_')) {
                updatedUser = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true }).select("-password");
            }
            if (!updatedUser && email) {
                updatedUser = await User.findOneAndUpdate({ email }, { $set: allowedUpdates }, { new: true }).select("-password");
            }
            if (!updatedUser) {
                throw new UserError("User account not found");
            }
            return updatedUser;
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(email) : null;
            if (!user) {
                user = {
                    _id: userId || `user_${Date.now()}`,
                    email,
                    fullName: allowedUpdates.fullName || 'Valued Customer',
                    mobile: allowedUpdates.mobile || '',
                    role: currentUser?.role || 'ROLE_CUSTOMER',
                    addresses: currentUser?.addresses || [],
                };
            } else {
                Object.assign(user, allowedUpdates);
            }
            if (AuthService.fallbackUsers) {
                AuthService.fallbackUsers.set(email, user);
            }
            return user;
        }
    }
}

module.exports = new UserService();
