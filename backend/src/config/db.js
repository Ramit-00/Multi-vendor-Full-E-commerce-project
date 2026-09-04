const mongoose = require('mongoose');
const DataInitializationService = require('../services/DataInitializationService');

// Load environment variables from .env file
require('dotenv').config();

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection active and verified.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost. Reconnecting...');
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    DataInitializationService.initializeAdminUser();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // In development, allow the app to run without MongoDB if explicitly allowed
    if (process.env.ALLOW_OFFLINE === 'true') {
      console.warn('ALLOW_OFFLINE is true — continuing without MongoDB connection (development only)');
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
