import 'dotenv/config';
import express from 'express';
import connectDB from './database/db.js';
import adminRoutes from './routers/AdminRoutes.js';
import sellerRoutes from './routers/sellerRoutes.js';
import userRoutes from './routers/userRoutes.js';
import authRoutes from './routers/AuthRouters.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'welcome bro' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);
app.use('/users', userRoutes);

app.listen(PORT, async () => {
  console.log(`server is running on http://localhost:${PORT}`);
  await connectDB();
});