const ProductService = require("../services/ProductService");
const { createProductSchema } = require("../validators/productValidators");
const Yup = require("yup");
const path = require('path');

let cloudinaryImageMap = {};
try {
  cloudinaryImageMap = require("../config/cloudinaryImageMap.json");
} catch (e) {
  cloudinaryImageMap = {};
}

function mapImage(img) {
  if (!img || typeof img !== "string") return img;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) return img;
  if (cloudinaryImageMap[img]) return cloudinaryImageMap[img];
  if (cloudinaryImageMap[img.toLowerCase()]) return cloudinaryImageMap[img.toLowerCase()];
  const basename = img.split(/[/\\]/).pop();
  if (cloudinaryImageMap[basename]) return cloudinaryImageMap[basename];
  if (cloudinaryImageMap[basename.toLowerCase()]) return cloudinaryImageMap[basename.toLowerCase()];
  return img;
}

class SellerProductController {
  async getProductBySellerId(req, res) {
    try {
      const seller = await req.seller;

      const products = await ProductService.getProductBySellerId(seller._id);
      const mapped = products.map(p => ({ ...p.toObject(), images: (p.images || []).map(mapImage) }));
      res.status(200).json(mapped);
    } catch (error) {
      // console.log("------ ");
      res.status(400).json({ error: error.message });
    }
  }

  // Create a product
  async createProduct(req, res) {
    try {
      await createProductSchema.validate(req.body, { abortEarly: false });

      const seller = await req.seller;

      const product = await ProductService.createProduct(req.body, seller);
      return res.status(201).json(product);
    } catch (error) {
      // console.log("------------- ",error.message)
     
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({
          error: "Validation error",
          errors: error.errors,
          count: error.errors.length,
        });
      }
      res.status(400).json({ error: error.message });
     
    }
  }

  // Delete a product
  async deleteProduct(req, res) {
    try {
      const sellerId = req.seller ? (req.seller.id || req.seller._id) : null;
      await ProductService.deleteProduct(req.params.productId, sellerId);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      const statusCode = error.message.includes("Access denied") ? 403 : 404;
      res.status(statusCode).json({ error: error.message });
    }
  }

  // Update a product
  async updateProduct(req, res) {
    try {
      const sellerId = req.seller ? (req.seller.id || req.seller._id) : null;
      const product = await ProductService.updateProduct(
        req.params.productId,
        req.body,
        sellerId
      );

      res.status(200).json(product);
    } catch (error) {
      const statusCode = error.message.includes("Access denied") ? 403 : 404;
      res.status(statusCode).json({ error: error.message });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await ProductService.findProductById(
        req.params.productId
      );
      const mapped = { ...(product.toObject ? product.toObject() : product), images: (product.images || []).map(mapImage) };
      res.status(200).json(mapped);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Search for products by query
  async searchProduct(req, res) {
    try {
      const query = req.query.query || req.query.q || req.query.keyword || req.query.search || "";
      const products = await ProductService.searchProduct(query);
      const mapped = products.map(p => ({ ...(p.toObject ? p.toObject() : p), images: (p.images || []).map(mapImage) }));
      return res.status(200).json(mapped);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts(req.query);
      // products is paginated response: { content, totalPages, totalElements }
      const mappedContent = (products.content || []).map(p => ({ ...p.toObject ? p.toObject() : p, images: ((p.images || [])).map(mapImage) }));
      const resp = { ...products, content: mappedContent };
      res.status(200).json(resp);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Bulk product creation for sellers
  async bulkCreateProducts(req, res) {
    try {
      const seller = req.seller;
      const { products } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "An array of products is required for bulk creation" });
      }

      const created = [];
      const errors = [];
      for (const prodData of products) {
        try {
          const newProd = await ProductService.createProduct(prodData, seller);
          created.push(newProd);
        } catch (e) {
          errors.push({ product: prodData.title || prodData.name, error: e.message });
        }
      }

      return res.status(201).json({
        message: `Successfully created ${created.length} products`,
        createdCount: created.length,
        failedCount: errors.length,
        created,
        errors,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Export catalog for seller
  async exportSellerProducts(req, res) {
    try {
      const sellerId = req.seller ? (req.seller.id || req.seller._id) : null;
      const products = await ProductService.getProductBySellerId(sellerId);
      return res.status(200).json({
        sellerId,
        exportedAt: new Date().toISOString(),
        totalProducts: products.length,
        products,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SellerProductController();
