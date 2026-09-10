require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();

// Trust reverse proxy headers (e.g. Vercel, Cloudflare, Nginx, AWS)
app.set('trust proxy', 1);

// Allowed Origins Whitelist
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
}));

// Standard Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});


const prisma = require('./config/prisma');

app.get('/', (req, res) => {
  res.send({message:'Welcome To E-COM Backend System!'});
});

app.get('/health', async (req, res) => {
  let pgStatus = 'unknown';
  let mongoStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    pgStatus = 'connected';
  } catch (err) {
    pgStatus = 'disconnected';
  }

  const mongoose = require('mongoose');
  mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let redisHealth = { status: 'unconfigured', latencyMs: 0 };
  try {
    const { checkRedisHealth } = require('./config/redis');
    redisHealth = await checkRedisHealth();
  } catch (rErr) {
    redisHealth = { status: 'offline', error: rErr.message };
  }

  const isHealthy = pgStatus === 'connected' && (mongoStatus === 'connected' || process.env.ALLOW_OFFLINE === 'true');
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    databases: {
      postgresql: pgStatus,
      mongodb: mongoStatus,
      redis: redisHealth.status,
    },
    redisLatencyMs: redisHealth.latencyMs || 0,
    uptime: process.uptime(),
  });
});

app.use(bodyParser.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// Lightweight NoSQL Query & Input Sanitizer (protects MongoDB filters against $ and . injection)
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeInput(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
});

const productRouters=require("./routers/productRoutes.js")
const authRouters=require("./routers/authRouters.js")
const adminRouters=require("./routers/adminRouters.js")
const cartRouters=require("./routers/cartRoutes.js")
const revenueRouters=require("./routers/revenueRoutes.js")
const sellerOrderRouters=require("./routers/sellerOrderRoutes.js")
const sellerProductRouters=require("./routers/sellerProductRoutes.js")
const sellerReportRouters=require("./routers/sellerReportRoutes.js")
const sellerRouters=require("./routers/sellerRoutes.js")
const transactionRouters=require("./routers/transactionRoutes.js")
const userRouters=require("./routers/userRoutes.js")
const wishlistRouters=require("./routers/wishlistRoutes.js")
const orderRouters=require("./routers/orderRoutes.js")
const paymentRoutres=require("./routers/paymentRoutes.js")
const dealRoutres=require("./routers/dealRoutes.js")
const couponRouters=require("./routers/couponRoutes.js")
const homeRouters=require("./routers/homeCategoryRoutes.js")
const chatboatRouters=require("./routers/chatboatRoutes.js")
const reviewRouters=require("./routers/reviewRouters.js")
const notificationRouters=require("./routers/notificationRoutes.js")
const payoutRouters=require("./routers/payoutRoutes.js")

const { authLimiter, apiLimiter, chatbotLimiter } = require("./middleware/rateLimiter.js");

// Apply general API rate limiter
app.use(apiLimiter);

// Sensitive Auth Rate Limiters (brute force and credential stuffing defense)
app.use('/auth', authLimiter, authRouters);
app.use('/admin/auth', authLimiter);
app.use('/sellers/login', authLimiter);
app.use('/sellers/verify', authLimiter);
app.use('/sellers/sent', authLimiter);
app.use('/sellers/forgot-password', authLimiter);

app.use("/api/users",userRouters)
app.use("/sellers", sellerRouters)
app.use("/products", productRouters)
app.use("/api/sellers/product", sellerProductRouters)
app.use("/api/cart", cartRouters);
app.use("/api/orders", orderRouters);
app.use("/api/seller/orders",sellerOrderRouters)
app.use("/api/transactions", transactionRouters)
app.use("/api/wishlist", wishlistRouters)
app.use("/api/sellers/report",sellerReportRouters)

app.use("/api/payment", paymentRoutres)
app.use("/home",homeRouters)
app.use("/admin/deals",dealRoutres)
app.use("/admin",adminRouters)

app.use("/api/coupons",couponRouters)
app.use("/api/sellers/revenue",revenueRouters)

app.use("/api/reviews",reviewRouters)
app.use("/api/notifications",notificationRouters)
app.use("/api/payouts", payoutRouters)

// AI Chatbot Rate Limiter (Gemini API quota protection)
app.use("/chat", chatbotLimiter, chatboatRouters)

// Centralized Global Error Handler (prevents leaking internal stack traces in production)
app.use((err, req, res, next) => {
  console.error('[Unhandled Request Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message,
  });
});

const { disconnectMongo } = require('./config/mongoose');

const port = process.env.PORT || 8080;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[PostgreSQL] Connected successfully via Prisma.');
  } catch (err) {
    console.error('[PostgreSQL] Prisma connection error:', err.message);
    if (process.env.ALLOW_OFFLINE !== 'true') {
      process.exit(1);
    }
  }

  try {
    await connectDB();
  } catch (err) {
    if (process.env.ALLOW_OFFLINE === 'true') {
      console.warn('ALLOW_OFFLINE is true — starting server without DB connection (development only)');
    } else {
      console.error('Failed to connect to Mongo DB:', err.message);
      process.exit(1);
    }
  }

  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Make sure no other instance is running.`);
      process.exit(1);
    }
    console.error('Server error', err);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('[PostgreSQL] Prisma disconnected.');
        await disconnectMongo();
      } catch (e) {
        console.error('Error during shutdown:', e.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

module.exports = app;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}