const mongoose = require('mongoose');
const DataInitializationService = require('../services/DataInitializationService');

// Load environment variables from .env file
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
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
