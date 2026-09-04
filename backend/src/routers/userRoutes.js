const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/userAuthMiddleware');

router.get('/profile', authMiddleware, userController.getUserProfileByJwt);
router.patch('/profile', authMiddleware, userController.updateUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.post('/address', authMiddleware, userController.addAddress);
router.delete('/address/:addressId', authMiddleware, userController.deleteAddress);

module.exports = router;
