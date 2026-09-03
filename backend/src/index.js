require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
app.use(cors());

const path = require('path');
// Serve product images from the workspace-level "product images" folder
const productImagesPath = path.join(__dirname, '..', '..', 'product images');
app.use('/product-images', express.static(productImagesPath));

app.get('/', (req, res) => {
  res.send({message:'Welcome To E-COM Backend System!'});
});

app.use(bodyParser.json());

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

app.use('/auth', authRouters);
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

// chatboat
app.use("/chat",chatboatRouters)

const port = process.env.PORT || 8080;

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    if (process.env.ALLOW_OFFLINE === 'true') {
      console.warn('ALLOW_OFFLINE is true — starting server without DB connection (development only)');
    } else {
      console.error('Failed to connect to DB:', err.message);
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
}

startServer();
// 