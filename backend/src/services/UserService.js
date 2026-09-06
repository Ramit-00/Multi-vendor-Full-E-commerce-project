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
            let user = await User.findOne({ email: normalized }).populate("addresses");
            const AuthService = require('./AuthService');
            const cached = AuthService.getFallbackUser ? AuthService.getFallbackUser(normalized) : null;

            if (user) {
                // If offline cache contains a newer user-edited profile, sync into MongoDB
                if (cached && cached.fullName && cached.fullName !== user.fullName) {
                    const cacheUpdated = cached.updatedAt ? new Date(cached.updatedAt).getTime() : 0;
                    const dbUpdated = user.updatedAt ? new Date(user.updatedAt).getTime() : 0;
                    if (cacheUpdated >= dbUpdated) {
                        user.fullName = cached.fullName;
                        if (cached.mobile) user.mobile = cached.mobile;
                        await User.updateOne({ email: normalized }, { $set: { fullName: user.fullName, mobile: user.mobile } });
                    }
                }
                AuthService.setFallbackUser(normalized, user.toObject ? user.toObject() : user);
                return user;
            } else if (cached) {
                // User exists in offline cache but not yet in DB, sync into MongoDB
                try {
                    const crypto = require('crypto');
                    const bcrypt = require('bcrypt');
                    const randomPassword = crypto.randomBytes(16).toString('hex');
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);
                    const newUser = new User({
                        email: normalized,
                        fullName: cached.fullName || (AuthService.formatDefaultName ? AuthService.formatDefaultName(normalized) : 'User'),
                        role: cached.role || 'ROLE_CUSTOMER',
                        accountType: cached.accountType || 'CUSTOMER',
                        status: cached.status || 'ACTIVE',
                        mobile: cached.mobile || '',
                        password: hashedPassword,
                    });
                    await newUser.save();
                    AuthService.setFallbackUser(normalized, newUser.toObject ? newUser.toObject() : newUser);
                    return newUser;
                } catch (e) {
                    console.warn("Could not sync cached user to DB:", e.message);
                    return cached;
                }
            } else {
                throw new UserError(`User does not exist with email ${email}`);
            }
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.getFallbackUser ? AuthService.getFallbackUser(normalized) : null;
            if (!user) {
                user = {
                    _id: `offline_${normalized}`,
                    fullName: AuthService.formatDefaultName ? AuthService.formatDefaultName(normalized) : (normalized.split('@')[0] || 'User'),
                    email: normalized,
                    mobile: '',
                    role: 'ROLE_CUSTOMER',
                    accountType: 'CUSTOMER',
                    status: 'ACTIVE',
                    addresses: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                if (AuthService.setFallbackUser) {
                    AuthService.setFallbackUser(normalized, user);
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
            return (AuthService.getFallbackUser ? AuthService.getFallbackUser(normalized) : (AuthService.fallbackUsers && AuthService.fallbackUsers.get(normalized))) || null;
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
        allowedUpdates.updatedAt = new Date().toISOString();

        if (dbConnected) {
            let updatedUser = null;
            if (userId && !String(userId).startsWith('offline_')) {
                updatedUser = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true }).select("-password").populate("addresses");
            }
            if (!updatedUser && email) {
                updatedUser = await User.findOneAndUpdate({ email }, { $set: allowedUpdates }, { new: true }).select("-password").populate("addresses");
            }
            if (!updatedUser) {
                throw new UserError("User account not found");
            }
            // Keep disk cache synced
            const AuthService = require('./AuthService');
            if (AuthService.setFallbackUser) {
                AuthService.setFallbackUser(email, updatedUser.toObject ? updatedUser.toObject() : updatedUser);
            }
            return updatedUser;
        } else {
            const AuthService = require('./AuthService');
            let user = AuthService.getFallbackUser ? AuthService.getFallbackUser(email) : null;
            if (!user) {
                user = {
                    _id: userId || `offline_${email}`,
                    email,
                    fullName: allowedUpdates.fullName || (AuthService.formatDefaultName ? AuthService.formatDefaultName(email) : 'User'),
                    mobile: allowedUpdates.mobile || '',
                    role: currentUser?.role || 'ROLE_CUSTOMER',
                    accountType: 'CUSTOMER',
                    status: 'ACTIVE',
                    addresses: currentUser?.addresses || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            } else {
                Object.assign(user, allowedUpdates);
            }
            if (AuthService.setFallbackUser) {
                AuthService.setFallbackUser(email, user);
            }
            return user;
        }
    }
}

module.exports = new UserService();
