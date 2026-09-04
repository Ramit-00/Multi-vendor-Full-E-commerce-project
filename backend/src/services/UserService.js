const User = require('../models/User');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class UserService {
    async findUserProfileByJwt(jwt) {
        const email = jwtProvider.getEmailFromJwt(jwt);
        const normalized = (email || '').toLowerCase().trim();
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            let user = await User.findOne({ email: normalized }).populate("addresses");
            if (!user && normalized) {
                const namePart = normalized.split('@')[0];
                const cleanName = namePart ? (namePart.charAt(0).toUpperCase() + namePart.slice(1)) : 'Customer';
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                user = new User({
                    email: normalized,
                    fullName: cleanName,
                    role: 'ROLE_CUSTOMER',
                    status: 'ACTIVE',
                    addresses: [],
                    password: hashedPassword,
                });
                await user.save();
            } else if (!user) {
                throw new UserError(`User does not exist with email ${email}`);
            }
            return user;
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(normalized) : null;
            if (!user) {
                const namePart = normalized.split('@')[0];
                const cleanName = namePart ? (namePart.charAt(0).toUpperCase() + namePart.slice(1)) : 'Customer';
                user = {
                    _id: `user_${Date.now()}`,
                    fullName: cleanName,
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
            if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                updatedUser = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true }).select("-password");
            }
            if (!updatedUser && email) {
                updatedUser = await User.findOneAndUpdate({ email }, { $set: allowedUpdates }, { new: true }).select("-password");
            }
            if (!updatedUser && email) {
                const namePart = email.split('@')[0];
                const cleanName = namePart ? (namePart.charAt(0).toUpperCase() + namePart.slice(1)) : 'Customer';
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                updatedUser = new User({
                    email,
                    fullName: allowedUpdates.fullName || cleanName,
                    mobile: allowedUpdates.mobile || '',
                    role: currentUser?.role || 'ROLE_CUSTOMER',
                    status: 'ACTIVE',
                    addresses: currentUser?.addresses || [],
                    password: hashedPassword,
                });
                await updatedUser.save();
            }
            if (!updatedUser) {
                throw new UserError("User account not found");
            }
            return updatedUser;
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(email) : null;
            if (!user) {
                const namePart = email.split('@')[0];
                const cleanName = namePart ? (namePart.charAt(0).toUpperCase() + namePart.slice(1)) : 'Customer';
                user = {
                    _id: userId || `user_${Date.now()}`,
                    email,
                    fullName: allowedUpdates.fullName || cleanName,
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
