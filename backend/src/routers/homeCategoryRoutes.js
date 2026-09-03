const express = require('express');
const homeCategoryController = require('../controllers/homeCategoryController');

const router = express.Router();

// Define routes
router.post('/categories',   homeCategoryController.createHomeCategories)
router.get('/home-category',   homeCategoryController.getHomeCategory)
router.patch('/home-category/:id',   homeCategoryController.updateHomeCategory)

module.exports = router;
