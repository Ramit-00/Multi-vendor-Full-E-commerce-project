const rateLimit = require('express-rate-limit');

// Strict rate limiter for sensitive authentication endpoints (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Chatbot rate limiter (protects Gemini AI quotas)
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 chatbot requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Chatbot rate limit exceeded. Please wait a minute before asking more questions.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
  apiLimiter,
  chatbotLimiter,
};
