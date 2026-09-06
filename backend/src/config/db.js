const mongoose = require('mongoose');
const DataInitializationService = require('../services/DataInitializationService');

// Load environment variables from .env file
require('dotenv').config();

let isReconnecting = false;
let reconnectTimer = null;

const syncOfflineCacheWithDB = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(__dirname, '..', '..', '.offline_cache.json');
    if (!fs.existsSync(cacheFile)) return;

    const raw = fs.readFileSync(cacheFile, 'utf-8');
    const cacheData = JSON.parse(raw);
    if (!cacheData || typeof cacheData !== 'object') return;

    const User = require('../models/User');
    const AuthService = require('../services/AuthService');
    const bcrypt = require('bcrypt');
    const crypto = require('crypto');

    console.log('[MongoDB Sync] Reconciling offline cache with MongoDB database...');

    for (const [emailKey, cachedUser] of Object.entries(cacheData)) {
      if (!emailKey || !cachedUser) continue;
      const normalizedEmail = emailKey.toLowerCase().trim();

      const existingDbUser = await User.findOne({ email: normalizedEmail });
      if (existingDbUser) {
        const cacheUpdated = cachedUser.updatedAt ? new Date(cachedUser.updatedAt).getTime() : 0;
        const dbUpdated = existingDbUser.updatedAt ? new Date(existingDbUser.updatedAt).getTime() : 0;

        // If offline cache has a newer profile edit, update MongoDB
        if (cachedUser.fullName && (cacheUpdated >= dbUpdated || !existingDbUser.fullName)) {
          existingDbUser.fullName = cachedUser.fullName;
          if (cachedUser.mobile) existingDbUser.mobile = cachedUser.mobile;
          await existingDbUser.save();
          console.log(`[MongoDB Sync] Updated MongoDB user from cache: ${normalizedEmail} -> "${existingDbUser.fullName}"`);
        }
        // Keep in-memory fallback up to date
        AuthService.setFallbackUser(normalizedEmail, existingDbUser.toObject ? existingDbUser.toObject() : existingDbUser);
      } else {
        // User exists offline but not yet in DB - create in MongoDB
        try {
          const randomPassword = crypto.randomBytes(16).toString('hex');
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const newUser = new User({
            email: normalizedEmail,
            fullName: cachedUser.fullName || AuthService.formatDefaultName(normalizedEmail),
            role: cachedUser.role || 'ROLE_CUSTOMER',
            accountType: cachedUser.accountType || 'CUSTOMER',
            status: cachedUser.status || 'ACTIVE',
            mobile: cachedUser.mobile || '',
            password: hashedPassword,
          });
          await newUser.save();
          console.log(`[MongoDB Sync] Seeded offline user into MongoDB: ${normalizedEmail} ("${newUser.fullName}")`);
          AuthService.setFallbackUser(normalizedEmail, newUser.toObject ? newUser.toObject() : newUser);
        } catch (seedErr) {
          console.warn(`[MongoDB Sync] Seed failed for ${normalizedEmail}:`, seedErr.message);
        }
      }
    }
    console.log('[MongoDB Sync] Reconciled all offline user profiles with MongoDB successfully.');
  } catch (syncErr) {
    console.warn('[MongoDB Sync] Error during reconciliation:', syncErr.message);
  }
};

const scheduleReconnect = () => {
  if (isReconnecting || reconnectTimer) return;
  console.log('[MongoDB] Scheduling background reconnect attempt in 5 seconds...');
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (mongoose.connection.readyState === 1) return;
    isReconnecting = true;
    try {
      console.log('[MongoDB] Attempting background reconnection...');
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
      });
      console.log(`[MongoDB] Reconnected successfully: ${conn.connection.host}`);
      await DataInitializationService.initializeAdminUser();
      await syncOfflineCacheWithDB();
    } catch (reconnErr) {
      console.warn(`[MongoDB] Background reconnection failed: ${reconnErr.message}`);
      scheduleReconnect();
    } finally {
      isReconnecting = false;
    }
  }, 5000);
};

// Global Mongoose event listeners
mongoose.connection.on('connected', async () => {
  console.log(`[MongoDB] Connection established: ${mongoose.connection.host}`);
  await syncOfflineCacheWithDB();
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Reconnection will be attempted automatically.');
  scheduleReconnect();
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    await DataInitializationService.initializeAdminUser();
    await syncOfflineCacheWithDB();
  } catch (error) {
    console.error(`MongoDB Initial Connection Error: ${error.message}`);
    // In development, allow the app to run without MongoDB if explicitly allowed, while scheduling background retries
    if (process.env.ALLOW_OFFLINE === 'true') {
      console.warn('ALLOW_OFFLINE is true — continuing and retrying MongoDB connection in background...');
      scheduleReconnect();
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
