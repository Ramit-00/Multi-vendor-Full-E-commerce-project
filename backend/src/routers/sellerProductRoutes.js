const express = require("express");
const productController = require("../controllers/productController");
const sellerAuthMiddleware = require("../middlewares/sellerAuthMiddleware");
const router = express.Router();

router.get(
  "/",
  sellerAuthMiddleware,
  productController.getProductBySellerId
);

router.post(
  "/",
  sellerAuthMiddleware,
  productController.createProduct
);

router.delete(
  "/:productId",
  sellerAuthMiddleware,
  productController.deleteProduct
);

// Update a product
router.put(
  "/:productId",
  sellerAuthMiddleware,
  productController.updateProduct
);

module.exports = router;
