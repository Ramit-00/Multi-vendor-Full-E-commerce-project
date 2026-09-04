const UserService = require('../services/UserService');
const UserError = require('../exceptions/UserError');
const Address = require('../models/Address');
const User = require('../models/User');
const mongoose = require('mongoose');

const getUserProfileByJwt = async (req, res) => {
    try {
        const authHeader = req.header("Authorization");
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            if (token) {
                const user = await UserService.findUserProfileByJwt(token);
                return res.status(200).json(user);
            }
        }
        const user = await req.user;
        return res.status(200).json(user);
    } catch (err) {
        handleErrors(err, res);
    }
};

const getUserByEmail = async (req, res) => {
    const { email } = req.query; 
    try {
        const user = await UserService.findUserByEmail(email);
        return res.status(200).json(user);
    } catch (err) {
        handleErrors(err, res);
    }
};

const addAddress = async (req, res) => {
    try {
        const user = await req.user;
        const addressData = req.body;
        const email = (user?.email || '').toLowerCase().trim();
        const userId = user?._id || user?.id;
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            const createdAddress = await Address.create(addressData);
            let dbUser = userId && !String(userId).startsWith('offline_') ? await User.findById(userId) : null;
            if (!dbUser && email) {
                dbUser = await User.findOne({ email });
            }
            if (dbUser) {
                if (!Array.isArray(dbUser.addresses)) dbUser.addresses = [];
                dbUser.addresses.push(createdAddress._id);
                await dbUser.save();
            }
            return res.status(201).json(createdAddress);
        } else {
            const AuthService = require('../services/AuthService');
            let fallbackUser = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(email) : null;
            const newAddress = {
                ...addressData,
                _id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            };
            if (!fallbackUser) {
                fallbackUser = {
                    _id: userId || `user_${Date.now()}`,
                    email,
                    fullName: user?.fullName || 'Valued Customer',
                    role: user?.role || 'ROLE_CUSTOMER',
                    addresses: [newAddress],
                };
            } else {
                if (!Array.isArray(fallbackUser.addresses)) fallbackUser.addresses = [];
                fallbackUser.addresses.push(newAddress);
            }
            if (AuthService.fallbackUsers) {
                AuthService.fallbackUsers.set(email, fallbackUser);
            }
            return res.status(201).json(newAddress);
        }
    } catch (err) {
        console.error("Error adding address:", err.message);
        return res.status(500).json({ message: "Failed to add address", error: err.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const user = await req.user;
        const { addressId } = req.params;
        const email = (user?.email || '').toLowerCase().trim();
        const userId = user?._id || user?.id;
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        if (dbConnected) {
            let dbUser = userId && !String(userId).startsWith('offline_') ? await User.findById(userId) : null;
            if (!dbUser && email) {
                dbUser = await User.findOne({ email });
            }
            if (dbUser && Array.isArray(dbUser.addresses)) {
                dbUser.addresses = dbUser.addresses.filter(a => String(a._id || a) !== String(addressId));
                await dbUser.save();
            }
            try {
                await Address.findByIdAndDelete(addressId);
            } catch (e) {}
            return res.status(200).json({ message: "Address deleted successfully", addressId });
        } else {
            const AuthService = require('../services/AuthService');
            const fallbackUser = AuthService.fallbackUsers ? AuthService.fallbackUsers.get(email) : null;
            if (fallbackUser && Array.isArray(fallbackUser.addresses)) {
                fallbackUser.addresses = fallbackUser.addresses.filter(a => String(a._id || a) !== String(addressId));
                if (AuthService.fallbackUsers) {
                    AuthService.fallbackUsers.set(email, fallbackUser);
                }
            }
            return res.status(200).json({ message: "Address deleted successfully", addressId });
        }
    } catch (err) {
        console.error("Error deleting address:", err.message);
        return res.status(500).json({ message: "Failed to delete address", error: err.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await req.user;
        const updatedUser = await UserService.updateUserProfile(user, req.body);
        return res.status(200).json(updatedUser);
    } catch (err) {
        handleErrors(err, res);
    }
};

const handleErrors = (err, res) => {
    if (err instanceof UserError) {
        return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
};

// Export the controller methods
module.exports = {
    getUserProfileByJwt,
    getUserByEmail,
    updateUserProfile,
    addAddress,
    deleteAddress,
};
