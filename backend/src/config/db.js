const { connectMongo, disconnectMongo } = require('./mongoose');
const DataInitializationService = require('../services/DataInitializationService');

const connectDB = async () => {
  const conn = await connectMongo();
  if (conn) {
    await DataInitializationService.initializeAdminUser();
  }
  return conn;
};

module.exports = connectDB;
