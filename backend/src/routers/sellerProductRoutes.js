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

router.post(
  "/bulk-create",
  sellerAuthMiddleware,
  productController.bulkCreateProducts
);

router.get(
  "/export",
  sellerAuthMiddleware,
  productController.exportSellerProducts
);

const cloudinaryController = require("../controllers/cloudinaryController");
router.post(
  "/cloudinary-sign",
  sellerAuthMiddleware,
  cloudinaryController.getUploadSignature
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
