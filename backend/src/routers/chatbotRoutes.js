const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');

router.post('/', ChatbotController.simpleChat);
router.post('/product/:productId', ChatbotController.askProductQuestionController);

module.exports = router;
