const express = require('express');
const homeCategoryController = require('../controllers/homeCategoryController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

// Public read route
router.get('/home-category', homeCategoryController.getHomeCategory);

// Protected admin mutation routes
router.post('/categories', adminAuthMiddleware, homeCategoryController.createHomeCategories);
router.patch('/home-category/:id', adminAuthMiddleware, homeCategoryController.updateHomeCategory);

module.exports = router;
