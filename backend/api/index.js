const app = require('../src/index');
const connectDB = require('../src/config/db');
const { mongoose } = require('../src/config/mongoose');

let isDbInitialized = false;

module.exports = async (req, res) => {
  if (!isDbInitialized) {
    try {
      await connectDB();
      isDbInitialized = true;
    } catch (err) {
      console.warn('[Vercel Lambda DB Init Notice]:', err.message);
    }
  }

  return app(req, res);
};
