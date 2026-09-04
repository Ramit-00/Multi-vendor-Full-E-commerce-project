const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

// 1. High-Security Admin Authentication (Validated via Master Secret Key)
router.post('/auth/login', adminController.adminLogin);

// 2. Verified Admin Profile
router.get('/auth/me', adminAuthMiddleware, adminController.getAdminProfile);

// 3. Platform Financial & Operational Analytics
router.get('/stats/overview', adminAuthMiddleware, adminController.getPlatformOverview);

// 4. Normal Users Management
router.get('/users', adminAuthMiddleware, adminController.getAllUsers);
router.patch('/users/:id/status', adminAuthMiddleware, adminController.updateUserStatus);
router.delete('/users/:id', adminAuthMiddleware, adminController.deleteUser);

// 5. Verified Sellers Management & Financials
router.get('/sellers', adminAuthMiddleware, adminController.getAllSellers);
router.patch('/sellers/:id/status', adminAuthMiddleware, adminController.updateSellerStatus);
router.delete('/sellers/:id', adminAuthMiddleware, adminController.deleteSeller);
router.get('/sellers/:id/financials', adminAuthMiddleware, adminController.getSellerFinancials);

// Legacy route compatibility
router.patch('/seller/:id/status/:status', adminAuthMiddleware, (req, res) => {
  req.body.status = req.params.status;
  return adminController.updateSellerStatus(req, res);
});

// 6. Global Marketplace Product Catalog
router.get('/products', adminAuthMiddleware, adminController.getAllProducts);
router.delete('/products/:productId', adminAuthMiddleware, adminController.deleteProduct);

// 7. Master Transactions Ledger
router.get('/transactions', adminAuthMiddleware, adminController.getAllTransactions);

module.exports = router;
