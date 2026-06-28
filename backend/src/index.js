import 'dotenv/config';
import express from 'express';
import connectDB from './database/db.js';
import adminRoutes from './router/adminRoutes.js';
import sellerRoutes from './router/sellerRoutes.js';
import userRoutes from './router/userRoutes.js';
import authRoutes from './router/authRouters.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'welcome bro' });
});

app.use('/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);

app.listen(PORT, async () => {
  console.log(`server is running on http://localhost:${PORT}`);
  await connectDB();
});