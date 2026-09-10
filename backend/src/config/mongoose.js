const mongoose = require('mongoose');
require('dotenv').config();

let isReconnecting = false;
let reconnectTimer = null;

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
    } catch (reconnErr) {
      console.warn(`[MongoDB] Background reconnection failed: ${reconnErr.message}`);
      scheduleReconnect();
    } finally {
      isReconnecting = false;
    }
  }, 5000);
};

// Global Mongoose event listeners
mongoose.connection.on('connected', () => {
  console.log(`[MongoDB] Connection established: ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Reconnection will be attempted automatically.');
  scheduleReconnect();
});

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongo = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((m) => {
      console.log(`MongoDB connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB Initial Connection Error: ${error.message}`);
    if (process.env.ALLOW_OFFLINE === 'true') {
      console.warn('ALLOW_OFFLINE is true — continuing and retrying MongoDB connection in background...');
      scheduleReconnect();
      return null;
    }
    throw error;
  }
};

const disconnectMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected cleanly.');
  }
};

module.exports = {
  connectMongo,
  disconnectMongo,
  mongoose,
};
