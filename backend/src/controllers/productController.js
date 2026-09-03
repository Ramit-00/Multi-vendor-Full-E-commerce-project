const Product = require("../models/Product");
const Seller = require("../models/Seller");
const ProductService = require("../services/ProductService");
const { createProductSchema } = require("../validators/productValidators");
const Yup = require("yup");
const path = require('path');

class SellerProductController {
  async getProductBySellerId(req, res) {
    try {
      const seller = await req.seller;

      const products = await ProductService.getProductBySellerId(seller._id);
      const host = req.get('host');
      const protocol = req.protocol;
      const mapImage = (img) => {
        if (!img) return img;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const parts = img.split('/').map(encodeURIComponent).join('/');
        return `${protocol}://${host}/product-images/${parts}`;
      };
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
      await ProductService.deleteProduct(req.params.productId);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update a product
  async updateProduct(req, res) {
    try {
      const product = await ProductService.updateProduct(
        req.params.productId,
        req.body
      );

      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await ProductService.findProductById(
        req.params.productId
      );
      const host = req.get('host');
      const protocol = req.protocol;
      const mapImage = (img) => {
        if (!img) return img;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const parts = img.split('/').map(encodeURIComponent).join('/');
        return `${protocol}://${host}/product-images/${parts}`;
      };
      const mapped = { ...(product.toObject ? product.toObject() : product), images: (product.images || []).map(mapImage) };
      res.status(200).json(mapped);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Search for products by query
  async searchProduct(req, res) {
    try {
      const query = req.query.q;
      const products = await ProductService.searchProduct(query);
      const host = req.get('host');
      const protocol = req.protocol;
      const mapImage = (img) => {
        if (!img) return img;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const parts = img.split('/').map(encodeURIComponent).join('/');
        return `${protocol}://${host}/product-images/${parts}`;
      };
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
      const host = req.get('host');
      const protocol = req.protocol;
      const mapImage = (img) => {
        if (!img) return img;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const parts = img.split('/').map(encodeURIComponent).join('/');
        return `${protocol}://${host}/product-images/${parts}`;
      };
      const mappedContent = (products.content || []).map(p => ({ ...p.toObject ? p.toObject() : p, images: ((p.images || [])).map(mapImage) }));
      const resp = { ...products, content: mappedContent };
      res.status(200).json(resp);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SellerProductController();
